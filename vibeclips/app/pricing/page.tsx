import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { getPlanId } from '@/lib/entitlements';
import PricingTable from '../components/PricingTable';

export const metadata: Metadata = {
  title: 'Pricing — VibeClips',
  description: 'Turn one idea into a month of scroll-stopping video. Plans from free to agency.',
};

// Billing state is per-user, so this page can't be statically cached.
export const dynamic = 'force-dynamic';

export default async function ClipsPricingPage() {
  const { userId } = await auth();

  let currentPlanId: string | null = null;
  if (userId) {
    try {
      currentPlanId = await getPlanId(userId);
    } catch (err) {
      // Pricing must render even if the database is unreachable.
      console.error('Could not resolve the current plan:', err);
    }
  }

  return <PricingTable isSignedIn={Boolean(userId)} currentPlanId={currentPlanId} />;
}
