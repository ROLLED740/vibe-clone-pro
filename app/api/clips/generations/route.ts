import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureMonthlyGrant, getBalance } from '@/lib/clips/credits';
import {
  GenerationError,
  createGeneration,
  ensureUserRow,
  listGenerations,
} from '@/lib/clips/generations';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [items, balance] = await Promise.all([listGenerations(userId), getBalance(userId)]);
    return NextResponse.json({ items, balance });
  } catch (error) {
    console.error('Failed to list generations:', error);
    return NextResponse.json({ error: 'Could not load your generations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    const clerkUser = await currentUser();
    await ensureUserRow(userId, clerkUser?.emailAddresses?.[0]?.emailAddress);
    await ensureMonthlyGrant(userId);

    const generation = await createGeneration({
      userId,
      kind: body?.kind === 'video' ? 'video' : 'image',
      idea: typeof body?.idea === 'string' ? body.idea : '',
      templateId: typeof body?.templateId === 'string' ? body.templateId : null,
      aspectRatio: typeof body?.aspectRatio === 'string' ? body.aspectRatio : undefined,
      sourceGenerationId:
        typeof body?.sourceGenerationId === 'string' ? body.sourceGenerationId : null,
    });

    return NextResponse.json({ generation, balance: await getBalance(userId) });
  } catch (error) {
    if (error instanceof GenerationError) {
      return NextResponse.json(
        { error: error.message, code: error.code, upgradeUrl: '/pricing' },
        { status: error.status }
      );
    }

    console.error('Failed to create generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
