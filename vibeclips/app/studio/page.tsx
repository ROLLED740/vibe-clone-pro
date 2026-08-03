import type { Metadata } from 'next';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ensureMonthlyGrant, getBalance } from '@/lib/credits';
import { getPlanId, getPlanName } from '@/lib/entitlements';
import { ensureUserRow, listGenerations } from '@/lib/generations';
import { isUsingStubProvider } from '@/lib/provider';
import StudioClient, { type Generation } from './StudioClient';

export const metadata: Metadata = {
  title: 'Studio — VibeClips',
  description: 'Turn a one-line idea into a scroll-stopping clip.',
};

export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/studio');

  const clerkUser = await currentUser();
  await ensureUserRow(userId, clerkUser?.emailAddresses?.[0]?.emailAddress);
  // Idempotent per billing period, so calling it on load beats needing a cron.
  await ensureMonthlyGrant(userId);

  const [rows, balance, planId] = await Promise.all([
    listGenerations(userId),
    getBalance(userId),
    getPlanId(userId),
  ]);

  // Dates don't survive the server/client boundary as Date objects.
  const items: Generation[] = rows.map((row) => ({
    id: row.id,
    kind: row.kind as Generation['kind'],
    status: row.status as Generation['status'],
    prompt: row.prompt,
    mediaUrl: row.mediaUrl,
    aspectRatio: row.aspectRatio,
    error: row.error,
    creditsSpent: row.creditsSpent,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <StudioClient
      initialItems={items}
      initialBalance={balance}
      planName={getPlanName(planId)}
      usingStubProvider={isUsingStubProvider()}
    />
  );
}
