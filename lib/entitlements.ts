import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, countDistinct, desc, eq, gte, isNotNull } from 'drizzle-orm';
import { clones, subscriptions, users } from '@/db/schema';
import { MONTHLY_BUILD_LIMIT, PLANS, resolveStripePriceId, type PlanId } from '@/lib/plans';

export interface Entitlements {
  planId: PlanId;
  planName: string;
  /** Builds allowed this month, or null when unmetered. */
  limit: number | null;
  /** Builds already used this calendar month. */
  used: number;
  remaining: number | null;
  canBuild: boolean;
}

function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return drizzle(neon(process.env.DATABASE_URL));
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Resolves which plan a user is on, defaulting to starter. */
export async function getPlanIdForUser(userId: string): Promise<PlanId> {
  const database = db();

  const [user] = await database.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user?.lifetimeAccess) return 'lifetime';

  const [sub] = await database
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) return 'starter';

  for (const plan of PLANS) {
    if (
      sub.stripePriceId === resolveStripePriceId(plan, 'monthly') ||
      sub.stripePriceId === resolveStripePriceId(plan, 'yearly')
    ) {
      return plan.id;
    }
  }

  // An active subscription we can't map still beats falling back to free.
  return 'pro';
}

/** Counts builds (not individual variants) started this calendar month. */
export async function getBuildsThisMonth(userId: string): Promise<number> {
  const [row] = await db()
    .select({ count: countDistinct(clones.buildId) })
    .from(clones)
    .where(
      and(
        eq(clones.userId, userId),
        isNotNull(clones.buildId),
        gte(clones.timestamp, startOfMonth())
      )
    );

  return row?.count ?? 0;
}

/**
 * Plan + usage for a user. Callers use this to gate generation and to render
 * the remaining-builds counter.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const planId = await getPlanIdForUser(userId);
  const limit = MONTHLY_BUILD_LIMIT[planId];
  const planName = PLANS.find((p) => p.id === planId)?.name ?? 'Starter';

  if (limit === null) {
    return { planId, planName, limit: null, used: 0, remaining: null, canBuild: true };
  }

  const used = await getBuildsThisMonth(userId);
  const remaining = Math.max(0, limit - used);

  return { planId, planName, limit, used, remaining, canBuild: remaining > 0 };
}
