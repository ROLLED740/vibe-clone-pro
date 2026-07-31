import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import pino from 'pino';
import { BuildError, ensureUserRow, runBuild } from '@/lib/generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const logger = pino({ level: 'info' });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to run a build.' }, { status: 401 });
    }

    const body = await req.json();
    // Accept the current shape ({ idea, imageBase64 }) and the older batch
    // shape ({ inputs: [...] }) so existing callers keep working.
    const input: { idea?: string; imageBase64?: string } = Array.isArray(body?.inputs)
      ? body.inputs[0] ?? {}
      : { idea: body?.idea, imageBase64: body?.imageBase64 };

    const clerkUser = await currentUser();
    await ensureUserRow(userId, clerkUser?.emailAddresses?.[0]?.emailAddress);

    const result = await runBuild({
      userId,
      idea: input.idea,
      imageBase64: input.imageBase64,
      keys: body?.keys ?? {},
    });

    return NextResponse.json({
      success: true,
      ...result,
      // Legacy fields, kept so older clients don't break.
      previews: result.variants.map((v) => v.previewUrl),
      codes: result.variants.map((v) => v.code),
    });
  } catch (error: unknown) {
    if (error instanceof BuildError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          ...(error.code === 'quota_exceeded'
            ? { upgradeUrl: '/pricing', usage: error.details }
            : {}),
        },
        { status: error.status }
      );
    }

    logger.error(`Swarm execution failed: ${String(error)}`);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Swarm execution failed' },
      { status: 500 }
    );
  }
}
