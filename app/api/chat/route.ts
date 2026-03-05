import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, modelName } = await req.json();

  // MAGIC ROUTER: Switch brains based on what the user clicked!
  let selectedModel;

  // Default to a specific model if the name isn't matched perfectly
  if (modelName === 'Gemini 1.5 Pro') {
    selectedModel = google('models/gemini-1.5-pro-latest');
  } else {
    // Fallback to GPT-4o for everything else for now
    selectedModel = openai('gpt-4o');
  }

  const result = await streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: selectedModel as any,
    messages,
    system: 'You are Vibe Engine, an expert AI software architect. You build full-stack apps. Be concise, technical, and confident.',
  });

  return result.toAIStreamResponse();
}
