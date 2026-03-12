import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { clones, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import pino from 'pino';

const logger = pino({ level: 'info' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const xai = createXai({ apiKey: process.env.XAI_API_KEY });
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const CONCURRENT_LIMIT = 15;
const limit = pLimit(CONCURRENT_LIMIT);

async function extractVibeWithVision(base64Image: string) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = `Analyze this UI design. Extract the exact color palette (hex codes), primary font styles, layout structure, and overall emotional tone. Output strict JSON: { "palette": ["#..."], "fonts": ["..."], "layout": "...", "tone": "..." }`;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: 'image/png' } }
    ]);

    try {
        const rawText = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(rawText);
    } catch (error: unknown) {
        logger.warn(`Failed to parse Vision JSON: ${String(error)}`);
        return { palette: ['#000000', '#FFFFFF'], fonts: ['sans-serif'], layout: 'standard', tone: 'neutral' };
    }
}

const retryClaude = (prompt: string) => pRetry(async () => {
    const res = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
    });
    // @ts-expect-error - Next.js strict linter requirement
    return res.content[0].text;
}, {
    retries: 2,
    minTimeout: 2000,
    onFailedAttempt: (context) => logger.warn(`Claude failed (Attempt ${context.attemptNumber})`)
});

const fallbackGrok = async (prompt: string) => {
    logger.info('Falling back to Grok...');
    const { text } = await generateText({
        model: xai('grok-2-latest'),
        prompt,
    });
    return text;
};

const fallbackGemini = async (prompt: string) => {
    logger.info('Falling back to Gemini...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const res = await model.generateContent(prompt);
    return res.response.text();
};

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const safeUserId = userId || 'demo-user-123';

        const { inputs } = await req.json();
        if (!Array.isArray(inputs) || inputs.length === 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        let customVoice = 'professional and modern';
        if (userId) {
            const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (userRecord.length > 0 && userRecord[0].vibeProfile) {
                customVoice = userRecord[0].vibeProfile as string;
            }
        }

        const tasks = inputs.map(input => limit(async () => {
            let vibeData = { palette: [], fonts: [], layout: '', tone: input.idea || 'standard' };
            if (input.imageBase64) {
                vibeData = await extractVibeWithVision(input.imageBase64);
            }

            const basePrompt = `Build a Next.js 15 Tailwind component for: ${input.idea}. Match this vibe: Tone: ${vibeData.tone}, Colors: ${vibeData.palette.join(',')}, Fonts: ${vibeData.fonts.join(',')}. Rewrite all copy in this voice: ${JSON.stringify(customVoice)}. Output ONLY raw React code. Ensure you use 'export default function App()'.`;

            const variants = ['original', 'thicc and bold', 'ethereal and glowing'];

            const variantPromises = variants.map(variant => {
                const variantPrompt = `${basePrompt} Apply a '${variant}' stylistic twist to the CSS.`;
                return retryClaude(variantPrompt)
                    .catch(() => fallbackGrok(variantPrompt))
                    .catch(() => fallbackGemini(variantPrompt))
                    .then(code => ({ variant, code }));
            });

            const generatedVariants = await Promise.all(variantPromises);

            const dbInserts = generatedVariants.map(async ({ variant, code }) => {
                const id = crypto.randomUUID();
                await db.insert(clones).values({
                    id, userId: safeUserId, input, vibeData, variantName: variant, generatedCode: code, previewUrl: `/preview/${id}`
                }).catch((err: Error) => logger.error(`DB Insert Failed: ${err.message}`));

                return { url: `/preview/${id}`, code: code };
            });

            return Promise.all(dbInserts);
        }));

        const allResults = await Promise.all(tasks);
        const flatResults = allResults.flat();

        return NextResponse.json({
            success: true,
            previews: flatResults.map(r => r.url),
            codes: flatResults.map(r => r.code)
        });

    } catch (error: unknown) {
        logger.error(`Swarm execution failed: ${String(error)}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}