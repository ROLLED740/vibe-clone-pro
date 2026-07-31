import 'server-only';

/**
 * Media generation provider abstraction.
 *
 * Two implementations ship: `fal` for real generation, and `stub` which returns
 * placeholder media so the whole product loop — queueing, polling, credits,
 * the gallery — can be exercised without an API key or spend.
 *
 * Providers are queue-based: `submit` returns a job handle immediately and
 * `poll` reports on it. Nothing here blocks a request for the length of a render.
 */

export type MediaKind = 'image' | 'video';

export interface SubmitImageParams {
  prompt: string;
  aspectRatio: string;
  kind: 'image';
}

export interface SubmitVideoParams {
  prompt: string;
  aspectRatio: string;
  kind: 'video';
  /** Still image the clip animates from. */
  imageUrl: string;
}

export type SubmitParams = SubmitImageParams | SubmitVideoParams;

export interface JobHandle {
  provider: string;
  jobId: string;
}

export type JobStatus =
  | { state: 'running' }
  | { state: 'succeeded'; mediaUrl: string; thumbnailUrl?: string }
  | { state: 'failed'; error: string };

export interface MediaProvider {
  readonly name: string;
  submit(params: SubmitParams): Promise<JobHandle>;
  poll(jobId: string, kind: MediaKind): Promise<JobStatus>;
}

/** Aspect ratios offered in the studio, mapped to pixel dimensions. */
export const ASPECT_RATIOS = {
  '9:16': { width: 720, height: 1280, label: 'Vertical' },
  '1:1': { width: 1024, height: 1024, label: 'Square' },
  '16:9': { width: 1280, height: 720, label: 'Widescreen' },
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

export function isAspectRatio(value: string): value is AspectRatio {
  return value in ASPECT_RATIOS;
}

// ---------------------------------------------------------------------------
// fal.ai
// ---------------------------------------------------------------------------

const FAL_QUEUE = 'https://queue.fal.run';

// Overridable so a model rename doesn't require a code change.
const FAL_IMAGE_MODEL = process.env.FAL_IMAGE_MODEL || 'fal-ai/flux/schnell';
const FAL_VIDEO_MODEL =
  process.env.FAL_VIDEO_MODEL || 'fal-ai/kling-video/v1/standard/image-to-video';

function falModel(kind: MediaKind): string {
  return kind === 'image' ? FAL_IMAGE_MODEL : FAL_VIDEO_MODEL;
}

function falHeaders(): HeadersInit {
  return {
    Authorization: `Key ${process.env.FAL_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Digs the first media URL out of a provider payload without assuming its shape. */
function extractMediaUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  for (const key of ['video', 'image', 'output']) {
    const value = record[key];
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string') {
      return (value as { url: string }).url;
    }
  }

  for (const key of ['images', 'videos', 'outputs']) {
    const value = record[key];
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && typeof first.url === 'string') return first.url;
    }
  }

  return null;
}

const falProvider: MediaProvider = {
  name: 'fal',

  async submit(params) {
    const { width, height } = ASPECT_RATIOS[
      (isAspectRatio(params.aspectRatio) ? params.aspectRatio : '9:16') as AspectRatio
    ];

    const input: Record<string, unknown> =
      params.kind === 'image'
        ? { prompt: params.prompt, image_size: { width, height } }
        : { prompt: params.prompt, image_url: params.imageUrl };

    const res = await fetch(`${FAL_QUEUE}/${falModel(params.kind)}`, {
      method: 'POST',
      headers: falHeaders(),
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`Provider rejected the job (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    if (!data?.request_id) throw new Error('Provider did not return a request id');

    return { provider: 'fal', jobId: data.request_id };
  },

  async poll(jobId, kind) {
    const model = falModel(kind);

    const statusRes = await fetch(`${FAL_QUEUE}/${model}/requests/${jobId}/status`, {
      headers: falHeaders(),
      cache: 'no-store',
    });

    if (!statusRes.ok) {
      return { state: 'failed', error: `Status check failed (${statusRes.status})` };
    }

    const status = await statusRes.json();

    if (status?.status === 'IN_QUEUE' || status?.status === 'IN_PROGRESS') {
      return { state: 'running' };
    }

    if (status?.status !== 'COMPLETED') {
      return { state: 'failed', error: status?.error ?? 'Generation failed' };
    }

    const resultRes = await fetch(`${FAL_QUEUE}/${model}/requests/${jobId}`, {
      headers: falHeaders(),
      cache: 'no-store',
    });

    if (!resultRes.ok) {
      return { state: 'failed', error: `Could not fetch result (${resultRes.status})` };
    }

    const mediaUrl = extractMediaUrl(await resultRes.json());
    if (!mediaUrl) return { state: 'failed', error: 'Provider returned no media' };

    return { state: 'succeeded', mediaUrl };
  },
};

// ---------------------------------------------------------------------------
// Stub — lets the full loop run with no key and no spend.
// ---------------------------------------------------------------------------

const STUB_DELAY_MS = 4000;

const stubProvider: MediaProvider = {
  name: 'stub',

  async submit(params) {
    // The job id carries its own completion time, so no state is needed here.
    return { provider: 'stub', jobId: `stub-${params.kind}-${Date.now() + STUB_DELAY_MS}` };
  },

  async poll(jobId, kind) {
    const readyAt = Number(jobId.split('-').pop());
    if (Number.isFinite(readyAt) && Date.now() < readyAt) return { state: 'running' };

    return {
      state: 'succeeded',
      mediaUrl: kind === 'video' ? '/vibe-logo-loop.mp4' : '/loading-vibe.gif',
    };
  },
};

/**
 * The active provider. Falls back to the stub when FAL_KEY is absent so a fresh
 * clone runs end to end without credentials.
 */
export function getProvider(): MediaProvider {
  if (process.env.MEDIA_PROVIDER === 'stub') return stubProvider;
  if (process.env.FAL_KEY) return falProvider;
  return stubProvider;
}

export function isUsingStubProvider(): boolean {
  return getProvider().name === 'stub';
}
