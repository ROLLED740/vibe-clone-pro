import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, model, keys } = await req.json();
    const apiKey = keys?.geminiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing. Please configure it in Settings.' },
        { status: 400 }
      );
    }

    const customGoogle = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    const result = await streamText({
      model: customGoogle(model || 'gemini-1.5-pro'),
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
