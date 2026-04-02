import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Validate environment variables right before instantiation
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not defined');
    }

    const { messages } = await req.json();

    const result = await streamText({
      model: google('models/gemini-1.5-pro-latest'),
      messages,
      system: 'You are the VibeClone Pro Copilot. Your job is to help the user write better UI architecture prompts, explain how the multi-model swarm works, and help them troubleshoot if their code compilation fails. Keep answers concise and helpful.',
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error('Copilot API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Copilot execution failed' }, 
      { status: 500 }
    );
  }
}
