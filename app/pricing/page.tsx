import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { desc, eq } from 'drizzle-orm';
import { users, subscriptions } from '@/db/schema';
import { PLANS, resolveStripePriceId } from '@/lib/plans';
import PricingTable from '../components/PricingTable';

export const metadata: Metadata = {
  title: 'Pricing — VibeClonePro',
  description:
    'Start free, upgrade when your builds start shipping. Every paid VibeClonePro plan includes the full Next.js export and commercial rights.',
};

// Billing state is per-user, so this page can't be statically cached.
export const dynamic = 'force-dynamic';

/**
 * Works out which plan the signed-in user is already on, so their card renders
 * as "Current plan" instead of offering a duplicate purchase.
 */
async function getCurrentPlanId(userId: string | null): Promise<string | null> {
  if (!userId || !process.env.DATABASE_URL) return null;

  try {
    const db = drizzle(neon(process.env.DATABASE_URL));

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user?.lifetimeAccess) return 'lifetime';

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1);

    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) return 'starter';

    // Map the Stripe price back onto a plan by checking each plan's configured IDs.
    for (const plan of PLANS) {
      const monthly = resolveStripePriceId(plan, 'monthly');
      const yearly = resolveStripePriceId(plan, 'yearly');
      if (sub.stripePriceId === monthly || sub.stripePriceId === yearly) return plan.id;
    }

    return null;
  } catch (err) {
    // Pricing must render even if the database is unreachable.
    console.error('Could not resolve current plan:', err);
    return null;
  }
}

export default async function PricingPage() {
  const { userId } = await auth();
  const currentPlanId = await getCurrentPlanId(userId);

  return <PricingTable isSignedIn={Boolean(userId)} currentPlanId={currentPlanId} />;
}
