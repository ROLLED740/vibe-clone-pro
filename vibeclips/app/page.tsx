import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { ArrowRight, Film, Layers, Sparkles, Wand2 } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: Wand2,
    title: 'Describe it',
    body: 'One line is enough. Pick a style and a format — vertical, square or widescreen.',
  },
  {
    icon: Sparkles,
    title: 'Preview it',
    body: 'A still comes back in seconds for a single credit. Generate as many as you like.',
  },
  {
    icon: Film,
    title: 'Animate it',
    body: 'Turn the still you like into a clip, then download it. You only pay to animate what works.',
  },
];

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-[#0B0B0C] text-white">
      <nav className="flex h-16 items-center justify-between border-b border-white/10 px-4 sm:px-8">
        <span className="text-lg font-black tracking-tight">
          VIBE<span className="text-[#06b6d4]">CLIPS</span>
        </span>
        <div className="flex items-center gap-5 text-sm font-medium">
          <Link href="/gallery" className="text-zinc-400 transition-colors hover:text-white">
            Gallery
          </Link>
          <Link href="/pricing" className="text-zinc-400 transition-colors hover:text-white">
            Pricing
          </Link>
          <Link
            href={userId ? '/studio' : '/sign-in?redirect_url=/studio'}
            className="rounded-lg bg-[#06A8C4] px-4 py-2 font-semibold transition-colors hover:bg-[#0895AE]"
          >
            {userId ? 'Open Studio' : 'Sign in'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pb-20 pt-20 text-center sm:pt-28">
        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Turn one idea into a month of scroll-stopping video.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
          Type a sentence. Get a still preview. Animate the one you like. No timeline, no render
          farm, no editor to learn.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={userId ? '/studio' : '/sign-up'}
            className="inline-flex items-center gap-2 rounded-xl bg-[#06A8C4] px-8 py-4 text-base font-bold transition-colors hover:bg-[#0895AE]"
          >
            Start free <ArrowRight size={18} />
          </Link>
          <Link
            href="/gallery"
            className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold transition-colors hover:bg-white/10"
          >
            See what people made
          </Link>
        </div>
        <p className="mt-5 text-sm text-zinc-500">
          No credit card needed · 30 free previews a day
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-[#141416] p-7">
              <div className="flex items-center gap-3">
                <Icon size={20} className="text-[#06b6d4]" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Step {index + 1}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{title}</h2>
              <p className="mt-2 leading-relaxed text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Styles */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="flex items-center gap-3">
          <Layers size={18} className="text-[#06b6d4]" />
          <h2 className="text-2xl font-black tracking-tight">Styles that land</h2>
        </div>
        <p className="mt-2 text-zinc-400">
          Each one is a directed look, so a one-line prompt still comes out deliberate.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {TEMPLATES.map((template) => (
            <div key={template.id} className="rounded-xl border border-white/10 bg-[#141416] p-5">
              <span className="text-2xl" aria-hidden="true">
                {template.emoji}
              </span>
              <h3 className="mt-2 font-bold">{template.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{template.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 text-center text-sm text-zinc-500">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link href="/pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
          <Link href="/gallery" className="transition-colors hover:text-white">
            Gallery
          </Link>
          <span>© {new Date().getFullYear()} VibeClips</span>
        </div>
      </footer>
    </main>
  );
}
