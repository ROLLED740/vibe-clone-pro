'use server';

import { auth } from '@clerk/nextjs/server';
import { inngest } from '@/src/inngest/client';

/**
 * Queues a build on the Inngest background worker.
 *
 * Use this for long builds that shouldn't hold a request open; the editor calls
 * /api/clone directly for the interactive path. Results are read back from
 * /api/clone/[id] once the worker has persisted them.
 */
export async function triggerSwarmAction(payload: { prompt?: string; imageBase64?: string }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Please sign in to run a build.');
  }

  const { ids } = await inngest.send({
    name: 'swarm/generate',
    data: {
      userId,
      prompt: payload.prompt,
      imageBase64: payload.imageBase64,
    },
  });

  return { queued: true, eventId: ids?.[0] ?? null };
}
