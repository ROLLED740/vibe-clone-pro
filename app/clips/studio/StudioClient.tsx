'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Film, Loader2, Sparkles, Wand2, AlertTriangle, X } from 'lucide-react';
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from '@/lib/clips/templates';

const ASPECTS = [
  { id: '9:16', label: 'Vertical', box: 'aspect-[9/16] w-6' },
  { id: '1:1', label: 'Square', box: 'aspect-square w-6' },
  { id: '16:9', label: 'Wide', box: 'aspect-[16/9] w-8' },
] as const;

export interface Generation {
  id: string;
  kind: 'image' | 'video';
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  prompt: string;
  mediaUrl: string | null;
  aspectRatio: string;
  error: string | null;
  creditsSpent: number;
  createdAt: string;
}

interface StudioClientProps {
  initialItems: Generation[];
  initialBalance: number;
  planName: string;
  usingStubProvider: boolean;
}

const POLL_INTERVAL_MS = 3000;

export default function StudioClient({
  initialItems,
  initialBalance,
  planName,
  usingStubProvider,
}: StudioClientProps) {
  const [idea, setIdea] = useState('');
  const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [items, setItems] = useState<Generation[]>(initialItems);
  const [balance, setBalance] = useState(initialBalance);
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const pending = items.filter((item) => item.status === 'queued' || item.status === 'running');

  const upsert = useCallback((generation: Generation) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === generation.id);
      if (index === -1) return [generation, ...prev];
      const next = [...prev];
      next[index] = generation;
      return next;
    });
  }, []);

  // Poll anything still rendering. Reading the status endpoint is what settles
  // a finished job, so this drives completion as well as reporting it.
  const pendingIds = pending.map((item) => item.id).join(',');
  const pollRef = useRef(pendingIds);
  pollRef.current = pendingIds;

  useEffect(() => {
    if (!pendingIds) return;

    let cancelled = false;
    const timer = window.setInterval(async () => {
      const ids = pollRef.current.split(',').filter(Boolean);

      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/clips/generations/${id}`, { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            if (cancelled) return;
            if (data.generation) upsert(data.generation);
            if (typeof data.balance === 'number') setBalance(data.balance);
          } catch {
            // Transient network failure — the next tick retries.
          }
        })
      );
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pendingIds, upsert]);

  const submit = async (kind: 'image' | 'video', sourceGenerationId?: string) => {
    if (kind === 'image' && !idea.trim()) return;

    setBusy(true);
    setError(null);
    setNeedsUpgrade(false);

    try {
      const res = await fetch('/api/clips/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          idea: kind === 'video' ? selected?.prompt ?? idea : idea,
          templateId,
          aspectRatio,
          sourceGenerationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.code === 'insufficient_credits' || data?.code === 'upgrade_required' || data?.code === 'daily_limit') {
          setNeedsUpgrade(true);
        }
        throw new Error(data?.error || 'Generation failed');
      }

      upsert(data.generation);
      setSelectedId(data.generation.id);
      if (typeof data.balance === 'number') setBalance(data.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0B0B0C]/95 px-4 backdrop-blur sm:px-6">
        <Link href="/clips/studio" className="text-lg font-black tracking-tight">
          VIBE<span className="text-[#06b6d4]">CLIPS</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-zinc-400 sm:inline">{planName}</span>
          <span className="rounded-full border border-white/15 px-3 py-1.5 font-semibold">
            {balance} credits
          </span>
          <Link
            href="/clips/pricing"
            className="rounded-lg bg-[#06A8C4] px-4 py-2 font-semibold transition-colors hover:bg-[#0895AE]"
          >
            Upgrade
          </Link>
        </div>
      </header>

      {usingStubProvider && (
        <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-center text-sm text-yellow-200">
          Demo mode — no <code className="font-mono">FAL_KEY</code> is set, so generations return
          placeholder media. The full flow still works end to end.
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[380px_1fr] sm:px-6">
        {/* ---------- Composer ---------- */}
        <div className="space-y-6">
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
              <Sparkles size={15} /> Your idea
            </h2>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="a praying mantis standing in Times Square"
              className="mt-3 h-28 w-full resize-none rounded-xl border border-white/10 bg-[#141416] p-4 text-[15px] outline-none transition-colors placeholder:text-zinc-600 focus:border-[#06b6d4]"
              aria-label="Describe what you want to see"
            />
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Style</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  title={template.blurb}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    templateId === template.id
                      ? 'border-[#06b6d4] bg-[#06b6d4]/10'
                      : 'border-white/10 bg-[#141416] hover:border-white/25'
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">
                    {template.emoji}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{template.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Format</h2>
            <div className="mt-3 flex gap-2">
              {ASPECTS.map((aspect) => (
                <button
                  key={aspect.id}
                  type="button"
                  onClick={() => setAspectRatio(aspect.id)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-all ${
                    aspectRatio === aspect.id
                      ? 'border-[#06b6d4] bg-[#06b6d4]/10'
                      : 'border-white/10 bg-[#141416] hover:border-white/25'
                  }`}
                >
                  <span className={`${aspect.box} rounded-sm border border-current opacity-70`} />
                  {aspect.label}
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => submit('image')}
            disabled={busy || !idea.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06A8C4] py-4 font-bold transition-all hover:bg-[#0895AE] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            Generate preview
          </button>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              {needsUpgrade && (
                <Link href="/clips/pricing" className="shrink-0 font-bold text-white underline">
                  Upgrade
                </Link>
              )}
              <button onClick={() => setError(null)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ---------- Stage + history ---------- */}
        <div className="space-y-6">
          <Stage
            generation={selected}
            busy={busy}
            onAnimate={() => selected && submit('video', selected.id)}
          />

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Your generations
            </h2>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Nothing yet — describe an idea and generate your first preview.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`relative aspect-[9/16] overflow-hidden rounded-lg border transition-all ${
                      selectedId === item.id
                        ? 'border-[#06b6d4]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    title={item.prompt}
                  >
                    <Thumb generation={item} />
                    {item.kind === 'video' && item.status === 'succeeded' && (
                      <Film
                        size={14}
                        className="absolute bottom-1.5 right-1.5 text-white drop-shadow"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Thumb({ generation }: { generation: Generation }) {
  if (generation.status === 'succeeded' && generation.mediaUrl) {
    return generation.kind === 'video' ? (
      <video src={generation.mediaUrl} className="h-full w-full object-cover" muted loop playsInline />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={generation.mediaUrl} alt={generation.prompt} className="h-full w-full object-cover" />
    );
  }

  if (generation.status === 'failed') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-red-950/40">
        <AlertTriangle size={14} className="text-red-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#141416]">
      <Loader2 size={14} className="animate-spin text-zinc-500" />
    </div>
  );
}

function Stage({
  generation,
  busy,
  onAnimate,
}: {
  generation: Generation | null;
  busy: boolean;
  onAnimate: () => void;
}) {
  if (!generation) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#141416] text-zinc-600">
        Your preview will appear here
      </div>
    );
  }

  const rendering = generation.status === 'queued' || generation.status === 'running';

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141416]">
      <div className="flex min-h-[320px] items-center justify-center bg-black p-4">
        {rendering && (
          <div className="flex flex-col items-center gap-3 py-20 text-zinc-400">
            <Loader2 size={28} className="animate-spin text-[#06b6d4]" />
            <p className="text-sm">
              {generation.kind === 'video' ? 'Animating your clip…' : 'Rendering your preview…'}
            </p>
          </div>
        )}

        {generation.status === 'failed' && (
          <div className="flex flex-col items-center gap-2 py-20 text-center text-red-300">
            <AlertTriangle size={24} />
            <p className="text-sm">{generation.error ?? 'Generation failed'}</p>
            <p className="text-xs text-zinc-500">Your credits were refunded.</p>
          </div>
        )}

        {generation.status === 'succeeded' &&
          generation.mediaUrl &&
          (generation.kind === 'video' ? (
            <video
              src={generation.mediaUrl}
              className="max-h-[60vh] w-auto rounded-lg"
              controls
              autoPlay
              loop
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generation.mediaUrl}
              alt={generation.prompt}
              className="max-h-[60vh] w-auto rounded-lg"
            />
          ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
        <p className="min-w-0 flex-1 truncate text-sm text-zinc-400" title={generation.prompt}>
          {generation.prompt}
        </p>

        <div className="flex shrink-0 gap-2">
          {generation.kind === 'image' && generation.status === 'succeeded' && (
            <button
              type="button"
              onClick={onAnimate}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-bold transition-colors hover:bg-[#1FB355] disabled:opacity-50"
            >
              <Film size={15} /> Animate
            </button>
          )}

          {generation.status === 'succeeded' && generation.mediaUrl && (
            <a
              href={generation.mediaUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              <Download size={15} /> Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
