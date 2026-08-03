import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublicGenerations } from '@/lib/generations';

export const metadata: Metadata = {
  title: 'Gallery — VibeClips',
  description: 'Clips the community has generated.',
};

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  let items: Awaited<ReturnType<typeof listPublicGenerations>> = [];

  try {
    items = await listPublicGenerations();
  } catch (error) {
    // The gallery is public, so it should still render if the database is down.
    console.error('Could not load the gallery:', error);
  }

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Made with VibeClips</h1>
          <p className="mt-3 text-zinc-400">
            Public generations from the community. Pro and Ultra generations stay private.
          </p>
          <Link
            href="/studio"
            className="mt-8 inline-block rounded-lg bg-[#06A8C4] px-6 py-3 font-bold transition-colors hover:bg-[#0895AE]"
          >
            Make your own
          </Link>
        </header>

        {items.length === 0 ? (
          <p className="mt-20 text-center text-zinc-500">
            Nothing here yet — be the first to publish a clip.
          </p>
        ) : (
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#141416]"
              >
                <div className="aspect-[9/16] bg-black">
                  {item.kind === 'video' ? (
                    <video
                      src={item.mediaUrl ?? undefined}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.mediaUrl ?? undefined}
                      alt={item.prompt}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <figcaption className="truncate p-3 text-xs text-zinc-400" title={item.prompt}>
                  {item.prompt}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
