'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, MonitorPlay, Code2, Shield, Layers, VolumeX, Volume2 } from 'lucide-react';
import FeatureDeck from '@/components/FeatureDeck';

export default function LandingPage() {
  const [activeVideo, setActiveVideo] = useState('/promo-video.MP4');
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const playlist = [
    { id: 'promo', title: 'System Overview', src: '/promo-video.MP4', icon: <MonitorPlay size={14} /> },
    { id: 'flicker', title: 'FlickerMania UI', src: '/FlickerMania.mp4', icon: <Layers size={14} /> },
    { id: 'loop', title: 'Core Engine Loop', src: '/vibe-logo-loop.mp4', icon: <Zap size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-cyan-500/30">

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full h-16 border-b border-gray-800 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 mr-2 flex-shrink-0 rounded-md overflow-hidden">
            <Image 
              src="/v-logo.png" 
              alt="VibeClone Pro Logo" 
              fill 
              className="object-contain" 
              priority
            />
            {/* The Mix-Blend Overlay: Turns white pixels to exact cyan-400, leaves black alone */}
            <div className="absolute inset-0 bg-cyan-400 mix-blend-multiply pointer-events-none"></div>
          </div>
          <span className="font-bold text-white text-xl tracking-wide">Vibe<span className="text-cyan-400">Clone</span>Pro</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/dashboard" className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors">
            Enter Workspace
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 px-6 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

        {/* THE LIGHTNING: Opacity cranked up to 80% */}
        <video
          ref={videoRef}
          src="/vibe-intro.mp4"
          autoPlay loop muted playsInline
          className="absolute top-0 left-0 w-full h-full object-cover opacity-80 mix-blend-screen pointer-events-none"
        />

        {/* Unmute Toggle Button */}
        <button
          onClick={toggleMute}
          className="absolute top-6 right-6 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-gray-700/50 rounded-full text-white/80 hover:text-white hover:bg-black/70 hover:border-cyan-500/50 transition-all font-medium text-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] group"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <>
              <VolumeX size={18} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
              <span>Unmute / Listen</span>
            </>
          ) : (
            <>
              <Volume2 size={18} className="text-cyan-400 animate-pulse" />
              <span className="text-cyan-50">Mute</span>
            </>
          )}
        </button>

        {/* Gradient overlay softened so the video punches through */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/40 to-[#050505] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">System Deployment Active</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 flex flex-col leading-[1.2] md:leading-[1.2]">
            <span className="text-white">Bring Your Own Key.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-600 tracking-tight">
              Build, Deploy, Monetize.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The professional AI-powered workflow companion. Describe your app, generate the source code, and take total ownership of your infrastructure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/editor" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-500 text-black font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Terminal size={18} /> Launch Command Center
            </Link>
          </div>
        </div>
      </section>

      {/* --- MULTI-VIDEO SHOWCASE --- */}
      <section id="demo" className="relative z-20 max-w-4xl mx-auto px-6 pb-32">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {playlist.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveVideo(item.src)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeVideo === item.src
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-[#0A0F14] text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-600'
                }`}
            >
              {item.icon} {item.title}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#0A0F14] shadow-2xl overflow-hidden flex flex-col">
          <div className="h-10 border-b border-gray-800 bg-[#05080A] flex items-center px-4 gap-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            <div className="ml-4 text-[10px] text-gray-500 font-mono">
              {activeVideo.replace('/', '')}
            </div>
          </div>

          <div className="relative aspect-video w-full bg-[#050505]">
            <video
              key={activeVideo}
              src={activeVideo}
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* --- FEATURE DECK (HIGH CONVERTING COPY) --- */}
      <FeatureDeck />

      {/* --- FEATURE GRID --- */}
      <section className="py-24 px-6 bg-[#020202] border-t border-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-[#0A0F14] border border-gray-800 hover:border-cyan-500/30 transition-colors group relative overflow-hidden">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
                <Code2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Total Code Ownership</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                No vendor lock-in. Export raw Next.js, Tailwind, and React code directly to your local machine or deploy instantly.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#0A0F14] border border-gray-800 hover:border-cyan-500/30 transition-colors group relative overflow-hidden">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Parallel AI Swarm</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Fire multiple LLMs simultaneously. Compare outputs from Claude, OpenAI, Gemini, and Grok instantly.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#0A0F14] border border-gray-800 hover:border-cyan-500/30 transition-colors group relative overflow-hidden">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Encrypted VibeVault</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Store your custom styles, color palettes, and component architecture securely in your private Neon DB.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* --- FOUNDER'S NOTE --- */}
      <section className="max-w-3xl mx-auto py-24 px-6">
        <div className="space-y-8">
          <p className="text-gray-300 leading-relaxed text-lg">
            &ldquo;The market is flooded with sandboxed toys and rented platforms. I built VibeClone Pro to give you the exact same deterministic firepower I use to build production-ready, global-scale architecture. Don{"'"}t rent your dreams. Own your codebase, launch your infrastructure in minutes, and out-ship everyone.&rdquo;
          </p>
          <div className="pt-4">
            <Image 
              src="/trapper-signature.png" 
              alt="Founder Signature" 
              width={200} 
              height={80} 
              className="opacity-90"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Terminal(props: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  const { size = 24, ...rest } = props;
  return (
    <svg {...rest} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  );
}