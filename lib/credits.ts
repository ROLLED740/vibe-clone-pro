import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq, sql } from 'drizzle-orm';
import { creditLedger } from '@/db/schema';
import { getPlanIdForUser } from '@/lib/entitlements';
import type { PlanId } from '@/lib/plans';

/** Credits granted at the start of each billing period, by plan. */
export const MONTHLY_CREDITS: Record<PlanId, number> = {
  free: 0,
  starter: 50,
  pro: 200,
  ultra: 500,
  enterprise: 2000,
};

/** First-month bonus on top of the usual grant. Mirrors the pricing page copy. */
export const FIRST_MONTH_BONUS: Partial<Record<PlanId, number>> = {
  pro: 100,
};

/** What each action costs. */
export const CREDIT_COST = {
  /** Static preview — cheap, and free plans get a daily allowance instead. */
  image: 1,
  /** Animating a still into a clip. */
  video: 10,
} as const;

export type GenerationKind = keyof typeof CREDIT_COST;

export class InsufficientCreditsError extends Error {
  constructor(
    readonly required: number,
    readonly balance: number
  ) {
    super(`This needs ${required} credits and you have ${balance}.`);
    this.name = 'InsufficientCreditsError';
  }
}

function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return drizzle(neon(process.env.DATABASE_URL));
}

/** Identifies the current billing period, so a monthly grant only lands once. */
function currentPeriodKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getBalance(userId: string): Promise<number> {
  const [row] = await db()
    .select({ balance: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int` })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId));

  return row?.balance ?? 0;
}

/**
 * Grants this period's credits if they haven't been granted yet.
 *
 * Idempotent on (userId, periodKey), so it's safe to call on every studio load
 * rather than needing a scheduled job.
 */
export async function ensureMonthlyGrant(userId: string): Promise<void> {
  const periodKey = currentPeriodKey();
  const database = db();

  const existing = await database
    .select({ id: creditLedger.id })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        eq(creditLedger.reason, 'grant'),
        eq(creditLedger.periodKey, periodKey)
      )
    )
    .limit(1);

  if (existing.length > 0) return;

  const planId = await getPlanIdForUser(userId);
  const amount = MONTHLY_CREDITS[planId];
  if (amount <= 0) return;

  // The first-month bonus applies only when this is the user's first grant.
  const priorGrants = await database
    .select({ id: creditLedger.id })
    .from(creditLedger)
    .where(and(eq(creditLedger.userId, userId), eq(creditLedger.reason, 'grant')))
    .limit(1);

  const bonus = priorGrants.length === 0 ? FIRST_MONTH_BONUS[planId] ?? 0 : 0;

  await database.insert(creditLedger).values({
    userId,
    delta: amount + bonus,
    reason: 'grant',
    periodKey,
  });
}

/**
 * Deducts credits for a generation.
 *
 * Writes the negative entry first and re-checks the resulting balance, so two
 * concurrent requests can't both pass a "do I have enough?" check and overdraw.
 * If the balance ends up negative the entry is rolled back with a refund.
 */
export async function spendCredits(
  userId: string,
  amount: number,
  generationId?: string
): Promise<number> {
  if (amount <= 0) return getBalance(userId);

  const database = db();

  const [entry] = await database
    .insert(creditLedger)
    .values({ userId, delta: -amount, reason: 'spend', generationId })
    .returning({ id: creditLedger.id });

  const balance = await getBalance(userId);

  if (balance < 0) {
    await database
      .insert(creditLedger)
      .values({ userId, delta: amount, reason: 'refund', generationId });
    await database.delete(creditLedger).where(eq(creditLedger.id, entry.id));
    throw new InsufficientCreditsError(amount, balance + amount);
  }

  return balance;
}

/** Returns credits after a failed generation. */
export async function refundCredits(userId: string, amount: number, generationId?: string) {
  if (amount <= 0) return;
  await db()
    .insert(creditLedger)
    .values({ userId, delta: amount, reason: 'refund', generationId });
}
