import 'server-only';

import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import pRetry from 'p-retry';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import pino from 'pino';
import { clones, userApiKeys, users } from '@/db/schema';
import { MODELS, VARIANTS } from '@/lib/models';
import { getEntitlements } from '@/lib/entitlements';

const logger = pino({ level: 'info' });

export interface ProviderKeys {
  anthropicKey?: string | null;
  geminiKey?: string | null;
  grokKey?: string | null;
}

export interface VibeData {
  palette: string[];
  fonts: string[];
  layout: string;
  tone: string;
}

export interface GeneratedVariant {
  id: string;
  variant: string;
  code: string;
  previewUrl: string;
}

export interface BuildResult {
  buildId: string;
  variants: GeneratedVariant[];
  vibeData: VibeData;
  usage: { limit: number | null; used: number; remaining: number | null; planName: string };
}

/** Thrown for conditions the caller should surface as a specific HTTP status. */
export class BuildError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'BuildError';
  }
}

export const DEFAULT_VIBE: VibeData = {
  palette: ['#050505', '#06b6d4', '#ffffff'],
  fonts: ['Inter', 'sans-serif'],
  layout: 'standard',
  tone: 'modern and confident',
};

/** Models like to wrap output in ``` fences despite being told not to. */
export function stripCodeFences(raw: string): string {
  const fenced = raw.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
  return (fenced ? fenced[1] : raw).trim();
}

function db() {
  if (!process.env.DATABASE_URL) throw new BuildError('DATABASE_URL is not configured', 500);
  return drizzle(neon(process.env.DATABASE_URL));
}

/** Merges request-supplied keys with the user's saved keys and the server defaults. */
export async function resolveKeys(userId: string, provided: ProviderKeys = {}): Promise<ProviderKeys> {
  let saved: ProviderKeys = {};

  if (process.env.DATABASE_URL) {
    try {
      const [row] = await db()
        .select()
        .from(userApiKeys)
        .where(eq(userApiKeys.userId, userId))
        .limit(1);
      if (row) {
        saved = { anthropicKey: row.anthropicKey, geminiKey: row.googleKey };
      }
    } catch (err) {
      logger.warn(`Could not load saved API keys: ${String(err)}`);
    }
  }

  return {
    anthropicKey: provided.anthropicKey || saved.anthropicKey || process.env.ANTHROPIC_API_KEY,
    geminiKey: provided.geminiKey || saved.geminiKey || process.env.GEMINI_API_KEY,
    grokKey: provided.grokKey || process.env.XAI_API_KEY,
  };
}

async function extractVibeWithVision(
  genAI: GoogleGenerativeAI,
  base64Image: string
): Promise<VibeData> {
  const model = genAI.getGenerativeModel({ model: MODELS.geminiVision });
  const prompt = `Analyze this UI design. Extract the exact color palette (hex codes), primary font styles, layout structure, and overall emotional tone. Output strict JSON: { "palette": ["#..."], "fonts": ["..."], "layout": "...", "tone": "..." }`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: 'image/png' } },
    ]);
    const parsed = JSON.parse(stripCodeFences(result.response.text()));
    return { ...DEFAULT_VIBE, ...parsed };
  } catch (error: unknown) {
    logger.warn(`Vision pass failed, using default vibe: ${String(error)}`);
    return DEFAULT_VIBE;
  }
}

const generateWithClaude = (anthropic: Anthropic, prompt: string) =>
  pRetry(
    async () => {
      const res = await anthropic.messages.create({
        model: MODELS.anthropic,
        max_tokens: 8192,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = res.content[0];
      if (block.type !== 'text') throw new Error('Anthropic returned a non-text block');
      return block.text;
    },
    {
      retries: 2,
      minTimeout: 2000,
      onFailedAttempt: (context) => logger.warn(`Claude failed (attempt ${context.attemptNumber})`),
    }
  );

/**
 * Ensures a `users` row exists — `clones.user_id` is a foreign key, so a
 * first-time builder can't have their build persisted without one.
 */
export async function ensureUserRow(userId: string, email?: string | null) {
  const database = db();
  const existing = await database.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existing.length > 0) return;

  await database
    .insert(users)
    .values({ id: userId, email: email || `${userId}@users.noreply.vibeclonepro.com` })
    .onConflictDoNothing();
}

/**
 * Runs one build: optional vision pass, N stylistic variants in parallel across
 * whichever providers have keys, then persists the results.
 *
 * Shared by the synchronous API route and the Inngest background worker so the
 * two paths can't drift.
 */
export async function runBuild(params: {
  userId: string;
  idea?: string | null;
  imageBase64?: string | null;
  keys?: ProviderKeys;
}): Promise<BuildResult> {
  const { userId } = params;
  const idea = params.idea?.trim() ?? '';
  const imageBase64 = params.imageBase64 ?? null;

  if (!idea && !imageBase64) {
    throw new BuildError('Describe what to build, or upload a reference image.', 400);
  }

  const keys = await resolveKeys(userId, params.keys);

  // Only one text provider is actually required — the rest are fallbacks.
  if (!keys.anthropicKey && !keys.geminiKey && !keys.grokKey) {
    throw new BuildError('No AI provider key configured. Add one in Settings.', 400);
  }
  if (imageBase64 && !keys.geminiKey) {
    throw new BuildError(
      'Image analysis needs a Gemini API key. Add one in Settings, or build from text.',
      400
    );
  }

  const database = db();

  const entitlements = await getEntitlements(userId);
  if (!entitlements.canBuild) {
    throw new BuildError(
      `You've used all ${entitlements.limit} builds on the ${entitlements.planName} plan this month.`,
      402,
      'quota_exceeded',
      entitlements
    );
  }

  const anthropic = keys.anthropicKey ? new Anthropic({ apiKey: keys.anthropicKey }) : null;
  const genAI = keys.geminiKey ? new GoogleGenerativeAI(keys.geminiKey) : null;
  const xai = keys.grokKey ? createXai({ apiKey: keys.grokKey }) : null;

  // The user's saved brand voice, stored as jsonb.
  let customVoice = 'professional and modern';
  const [userRecord] = await database.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecord?.vibeProfile) {
    const profile = userRecord.vibeProfile;
    customVoice = typeof profile === 'string' ? profile : JSON.stringify(profile);
  }

  const vibeData: VibeData =
    imageBase64 && genAI
      ? await extractVibeWithVision(genAI, imageBase64)
      : { ...DEFAULT_VIBE, tone: idea || DEFAULT_VIBE.tone };

  const basePrompt = [
    `Build a single self-contained React component for: ${idea || 'the uploaded reference design'}.`,
    `Match this vibe — tone: ${vibeData.tone}; colors: ${vibeData.palette.join(', ')}; fonts: ${vibeData.fonts.join(', ')}; layout: ${vibeData.layout}.`,
    `Write all copy in this voice: ${customVoice}.`,
    `Style with Tailwind utility classes only. Do not import any CSS.`,
    `Output ONLY raw TSX with no prose and no markdown fences. It must declare 'export default function App()'.`,
  ].join(' ');

  /** Try Claude, then Grok, then Gemini — whichever keys exist. */
  const generate = async (prompt: string): Promise<string> => {
    const attempts: (() => Promise<string>)[] = [];
    if (anthropic) attempts.push(() => generateWithClaude(anthropic, prompt));
    if (xai) {
      attempts.push(async () => {
        const { text } = await generateText({ model: xai(MODELS.xai), prompt });
        return text;
      });
    }
    if (genAI) {
      attempts.push(async () => {
        const model = genAI.getGenerativeModel({ model: MODELS.gemini });
        const res = await model.generateContent(prompt);
        return res.response.text();
      });
    }

    let lastError: unknown;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (err) {
        lastError = err;
        logger.warn(`Generation attempt failed: ${String(err)}`);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('All providers failed');
  };

  const buildId = crypto.randomUUID();

  const settled = await Promise.allSettled(
    VARIANTS.map(async (variant): Promise<{ variant: string; code: string }> => {
      const code = stripCodeFences(
        await generate(`${basePrompt} Apply a '${variant}' stylistic twist to the CSS.`)
      );
      return { variant, code };
    })
  );

  const generated = settled
    .filter(
      (r): r is PromiseFulfilledResult<{ variant: string; code: string }> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value);

  if (generated.length === 0) {
    logger.error('Every variant failed to generate');
    throw new BuildError(
      'Generation failed across all providers. Check your API keys and try again.',
      502
    );
  }

  const input = { idea, hasImage: Boolean(imageBase64) };

  const variants = await Promise.all(
    generated.map(async ({ variant, code }) => {
      const id = crypto.randomUUID();
      try {
        await database.insert(clones).values({
          id,
          buildId,
          userId,
          input,
          vibeData,
          variantName: variant,
          generatedCode: code,
          previewUrl: `/preview/${id}`,
        });
      } catch (err) {
        logger.error(`DB insert failed for variant ${variant}: ${String(err)}`);
      }
      return { id, variant, code, previewUrl: `/preview/${id}` };
    })
  );

  return {
    buildId,
    variants,
    vibeData,
    usage: {
      limit: entitlements.limit,
      used: entitlements.used + 1,
      remaining: entitlements.remaining === null ? null : entitlements.remaining - 1,
      planName: entitlements.planName,
    },
  };
}
