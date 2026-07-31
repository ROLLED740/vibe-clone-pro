import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, desc, eq, gte } from 'drizzle-orm';
import { generations, users } from '@/db/schema';
import { CREDIT_COST, InsufficientCreditsError, refundCredits, spendCredits } from '@/lib/credits';
import { getPlanIdForUser } from '@/lib/entitlements';
import { getProvider, isAspectRatio, type MediaKind } from '@/lib/video/provider';
import { buildPrompt, getTemplate } from '@/lib/video/templates';

/** Static previews a free user may run per day, matching the pricing page. */
export const FREE_DAILY_PREVIEWS = 30;

/** Plans whose generations default to private. */
const PRIVATE_PLANS = new Set(['pro', 'ultra', 'enterprise']);

export class GenerationError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

function db() {
  if (!process.env.DATABASE_URL) throw new GenerationError('DATABASE_URL is not configured', 500);
  return drizzle(neon(process.env.DATABASE_URL));
}

export type GenerationRow = typeof generations.$inferSelect;

/** Ensures a `users` row exists — generations are a foreign key into it. */
export async function ensureUserRow(userId: string, email?: string | null) {
  const database = db();
  const existing = await database.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existing.length > 0) return;

  await database
    .insert(users)
    .values({ id: userId, email: email || `${userId}@users.noreply.vibeclonepro.com` })
    .onConflictDoNothing();
}

async function countPreviewsToday(userId: string): Promise<number> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const rows = await db()
    .select({ id: generations.id })
    .from(generations)
    .where(
      and(
        eq(generations.userId, userId),
        eq(generations.kind, 'image'),
        gte(generations.createdAt, since)
      )
    );

  return rows.length;
}

/**
 * Queues a generation.
 *
 * Credits are taken before the job is submitted and refunded if submission
 * fails, so a provider outage never silently costs the user.
 */
export async function createGeneration(params: {
  userId: string;
  kind: MediaKind;
  idea: string;
  templateId?: string | null;
  aspectRatio?: string;
  /** Required for videos: the still to animate. */
  sourceGenerationId?: string | null;
}): Promise<GenerationRow> {
  const { userId, kind } = params;
  const idea = params.idea?.trim() ?? '';

  if (!idea) throw new GenerationError('Describe what you want to see.', 400);
  if (idea.length > 1000) throw new GenerationError('That prompt is too long.', 400);

  const aspectRatio =
    params.aspectRatio && isAspectRatio(params.aspectRatio) ? params.aspectRatio : '9:16';

  const database = db();
  const planId = await getPlanIdForUser(userId);

  // Videos are a paid feature; free users generate stills and upgrade to animate.
  if (kind === 'video' && planId === 'free') {
    throw new GenerationError(
      'Animating a still into a clip is available on paid plans.',
      402,
      'upgrade_required'
    );
  }

  // Free stills are metered per day rather than against the credit balance.
  if (kind === 'image' && planId === 'free') {
    const used = await countPreviewsToday(userId);
    if (used >= FREE_DAILY_PREVIEWS) {
      throw new GenerationError(
        `You've used all ${FREE_DAILY_PREVIEWS} free previews today. They reset at midnight UTC.`,
        402,
        'daily_limit'
      );
    }
  }

  let sourceImageUrl: string | undefined;
  if (kind === 'video') {
    if (!params.sourceGenerationId) {
      throw new GenerationError('Pick a preview to animate first.', 400);
    }

    const [source] = await database
      .select()
      .from(generations)
      .where(
        and(eq(generations.id, params.sourceGenerationId), eq(generations.userId, userId))
      )
      .limit(1);

    if (!source) throw new GenerationError('That preview could not be found.', 404);
    if (source.status !== 'succeeded' || !source.mediaUrl) {
      throw new GenerationError('That preview has not finished rendering yet.', 409);
    }
    sourceImageUrl = source.mediaUrl;
  }

  // Free stills cost nothing; everything else draws down credits.
  const cost = planId === 'free' && kind === 'image' ? 0 : CREDIT_COST[kind];

  const [row] = await database
    .insert(generations)
    .values({
      userId,
      kind,
      status: 'queued',
      prompt: idea,
      templateId: params.templateId ?? null,
      aspectRatio,
      sourceGenerationId: params.sourceGenerationId ?? null,
      creditsSpent: cost,
      isPublic: !PRIVATE_PLANS.has(planId),
    })
    .returning();

  try {
    await spendCredits(userId, cost, row.id);
  } catch (err) {
    await database.delete(generations).where(eq(generations.id, row.id));
    if (err instanceof InsufficientCreditsError) {
      throw new GenerationError(err.message, 402, 'insufficient_credits');
    }
    throw err;
  }

  const template = getTemplate(params.templateId);
  const prompt =
    kind === 'video'
      ? [buildPrompt(idea, params.templateId), template?.motionPrompt].filter(Boolean).join('. ')
      : buildPrompt(idea, params.templateId);

  try {
    const provider = getProvider();
    const handle =
      kind === 'video'
        ? await provider.submit({ kind, prompt, aspectRatio, imageUrl: sourceImageUrl! })
        : await provider.submit({ kind, prompt, aspectRatio });

    const [updated] = await database
      .update(generations)
      .set({
        status: 'running',
        provider: handle.provider,
        providerJobId: handle.jobId,
        updatedAt: new Date(),
      })
      .where(eq(generations.id, row.id))
      .returning();

    return updated;
  } catch (err) {
    // Submission failed, so the user should not be charged for it.
    await refundCredits(userId, cost, row.id);

    const message = err instanceof Error ? err.message : 'Could not start the generation';
    const [failed] = await database
      .update(generations)
      .set({ status: 'failed', error: message, creditsSpent: 0, updatedAt: new Date() })
      .where(eq(generations.id, row.id))
      .returning();

    return failed;
  }
}

/**
 * Reads a generation, advancing it by polling the provider when it's still
 * running. Polling on read keeps the product working without a worker process.
 */
export async function refreshGeneration(
  userId: string,
  generationId: string
): Promise<GenerationRow | null> {
  const database = db();

  const [row] = await database
    .select()
    .from(generations)
    .where(and(eq(generations.id, generationId), eq(generations.userId, userId)))
    .limit(1);

  if (!row) return null;
  if (row.status !== 'running' || !row.providerJobId) return row;

  const status = await getProvider().poll(row.providerJobId, row.kind as MediaKind);

  if (status.state === 'running') return row;

  if (status.state === 'failed') {
    await refundCredits(userId, row.creditsSpent, row.id);
    const [failed] = await database
      .update(generations)
      .set({ status: 'failed', error: status.error, creditsSpent: 0, updatedAt: new Date() })
      .where(eq(generations.id, row.id))
      .returning();
    return failed;
  }

  const [succeeded] = await database
    .update(generations)
    .set({
      status: 'succeeded',
      mediaUrl: status.mediaUrl,
      thumbnailUrl: status.thumbnailUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(generations.id, row.id))
    .returning();

  return succeeded;
}

export async function listGenerations(userId: string, limit = 40): Promise<GenerationRow[]> {
  return db()
    .select()
    .from(generations)
    .where(eq(generations.userId, userId))
    .orderBy(desc(generations.createdAt))
    .limit(limit);
}

/** Public gallery feed — only finished, public generations. */
export async function listPublicGenerations(limit = 48): Promise<GenerationRow[]> {
  return db()
    .select()
    .from(generations)
    .where(and(eq(generations.isPublic, true), eq(generations.status, 'succeeded')))
    .orderBy(desc(generations.createdAt))
    .limit(limit);
}
