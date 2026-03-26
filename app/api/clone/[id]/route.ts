import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { clones } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import pino from 'pino';

export const dynamic = 'force-dynamic';

const logger = pino({ level: 'info' });

type RouteContext = {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined');
        }

        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);

        const { userId } = await auth();
        
        // Ensure user is signed in to check status
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
        }

        const cloneRecords = await db
            .select()
            .from(clones)
            .where(eq(clones.id, id));

        if (!cloneRecords || cloneRecords.length === 0) {
            // Background job hasn't inserted it yet
            return NextResponse.json({ status: 'pending', data: [] }, { status: 404 });
        }

        const record = cloneRecords[0];

        if (record.generatedCode.includes('FAILED') || record.generatedCode.includes('ERROR')) {
            return NextResponse.json({ status: 'failed', data: cloneRecords });
        } else if (record.generatedCode === 'PENDING') {
            return NextResponse.json({ status: 'pending', data: cloneRecords });
        }

        return NextResponse.json({ status: 'completed', data: cloneRecords });
        
    } catch (error: unknown) {
        logger.error(`Status check failed: ${String(error)}`);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' }, 
            { status: 500 }
        );
    }
}
