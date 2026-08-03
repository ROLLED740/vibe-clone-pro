import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { desc, eq } from 'drizzle-orm';
import { subscriptions } from '@/db/schema';
import { PLANS, resolveStripePriceId, type ClipPlanId } from '@/lib/clips/plans';

/**
 * Which VibeClips tier a user is on.
 *
 * Deliberately separate from lib/entitlements.ts: a VibeClonePro subscription
 * grants nothing here, and vice versa. Both read the same `subscriptions`
 * table but match against their own product's Stripe price IDs, so a user can
 * hold one, both, or neither.
 */
export async function getClipPlanId(userId: string): Promise<ClipPlanId> {
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
  const ranked: ClipPlanId[] = ['ultra', 'pro', 'starter'];
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

export function getClipPlanName(planId: ClipPlanId): string {
  return PLANS.find((p) => p.id === planId)?.name ?? 'Free plan';
}
