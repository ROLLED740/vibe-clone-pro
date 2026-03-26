import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Validate environment variables right before instantiation
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

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

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat execution failed' }, 
      { status: 500 }
    );
  }
}
