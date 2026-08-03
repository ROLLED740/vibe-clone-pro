import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { desc, eq } from 'drizzle-orm';
import { subscriptions } from '@/db/schema';
import { PLANS, resolveStripePriceId, type PlanId } from '@/lib/plans';

/**
 * Which tier a user is on, resolved by matching their active Stripe
 * subscription against the price IDs configured for each plan.
 */
export async function getPlanId(userId: string): Promise<PlanId> {
  if (!process.env.DATABASE_URL) return 'free';

  const db = drizzle(neon(process.env.DATABASE_URL));

  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(10);

  const active = subs.filter((s) => s.status === 'active' || s.status === 'trialing');

  // Highest tier wins if somehow more than one matches.
  const ranked: PlanId[] = ['ultra', 'pro', 'starter'];
  for (const planId of ranked) {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) continue;

    const monthly = resolveStripePriceId(plan, 'monthly');
    const yearly = resolveStripePriceId(plan, 'yearly');

    if (active.some((s) => s.stripePriceId === monthly || s.stripePriceId === yearly)) {
      return planId;
    }
  }

  return 'free';
}

export function getPlanName(planId: PlanId): string {
  return PLANS.find((p) => p.id === planId)?.name ?? 'Free plan';
}
