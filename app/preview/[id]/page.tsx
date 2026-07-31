import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import { ChevronLeft } from 'lucide-react';
import { clones } from '@/db/schema';
import ClonePreview from '@/components/ClonePreview';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId || !process.env.DATABASE_URL) notFound();

  const db = drizzle(neon(process.env.DATABASE_URL));

  // Scoped to the caller so a build URL can't be read by another account.
  const [record] = await db
    .select()
    .from(clones)
    .where(and(eq(clones.id, id), eq(clones.userId, userId)))
    .limit(1);

  if (!record) notFound();

  const input = record.input as { idea?: string } | null;

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-cyan-400"
        >
          <ChevronLeft size={16} /> Back to dashboard
        </Link>

        <header className="mt-6 mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-500">
            {record.variantName} variant
          </p>
          <h1 className="mt-2 text-2xl font-bold">{input?.idea || 'Generated build'}</h1>
        </header>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <ClonePreview code={record.generatedCode} />
        </div>
      </div>
    </main>
  );
}
