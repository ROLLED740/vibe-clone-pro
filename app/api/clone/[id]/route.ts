import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { clones } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import pino from 'pino';

const logger = pino({ level: 'info' });
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

type RouteContext = {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
    try {
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

        // Technically, one `id` group from the swarm logic saves multiple variants as new UUID rows, 
        // but let's assume `id` here fetches the parent payload, or the swarm logic has updated to group them by a `groupId`.
        // Under current schema, ID is PK. So it's 1 row. Fetching by input ID or grouping might be necessary depending on QStash implementation.

        const record = cloneRecords[0];

        if (record.generatedCode.includes('FAILED') || record.generatedCode.includes('ERROR')) {
            return NextResponse.json({ status: 'failed', data: cloneRecords });
        } else if (record.generatedCode === 'PENDING') {
            return NextResponse.json({ status: 'pending', data: cloneRecords });
        }

        return NextResponse.json({ status: 'completed', data: cloneRecords });
        
    } catch (error: unknown) {
        logger.error(`Status check failed: ${String(error)}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
