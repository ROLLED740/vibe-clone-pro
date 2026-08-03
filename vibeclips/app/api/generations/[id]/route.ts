import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBalance } from '@/lib/credits';
import { refreshGeneration } from '@/lib/generations';

export const dynamic = 'force-dynamic';

/**
 * Status endpoint the studio polls. Reading advances the job: if the provider
 * has finished, the row is settled here, so no worker process is required.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const generation = await refreshGeneration(userId, id);

    if (!generation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ generation, balance: await getBalance(userId) });
  } catch (error) {
    console.error('Failed to refresh generation:', error);
    return NextResponse.json({ error: 'Could not check that generation' }, { status: 500 });
  }
}
