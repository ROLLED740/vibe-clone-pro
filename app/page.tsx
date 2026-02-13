'use client';
import React, { useState } from 'react';
import { CreativeTerminal } from '@/components/CreativeTerminal'; 
import { StitchSuccess } from '@/components/StitchSuccess';
import { Send, Link as LinkIcon, Sparkles } from 'lucide-react';

export default function VibeDashboard() {
  const [viewState, setViewState] = useState<'idle' | 'generating' | 'success'>('idle');
  const [prompt, setPrompt] = useState('');

  const handleStart = () => {
    if (!prompt.trim()) return;
    setViewState('generating');
  };

  if (viewState === 'idle') {
    return (
      <main className="min-h-screen bg-[#020502] text-white flex flex-col relative overflow-hidden font-sans selection:bg-cyan-500/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
        <header className="flex justify-between items-center p-6 z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-black">V</div>
            <span className="text-sm font-medium tracking-wide">VibeClonePro</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-500 bg-cyan-900/10 px-3 py-1 rounded-full border border-cyan-900/50">
             <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"/>
             SYSTEM ONLINE
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center z-10 max-w-2xl mx-auto w-full px-4">
          <h1 className="text-5xl font-medium tracking-tight mb-4 text-center bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Clone. Build. Monetize.
          </h1>
          <p className="text-gray-500 text-center mb-12 max-w-md text-sm leading-relaxed">
            Enter a URL to clone or describe your dream app. We handle the infrastructure, you keep the profit.
          </p>

          <div className="w-full relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-full" />
            <div className="relative bg-[#0A0A0A] border border-gray-800 rounded-full p-2 pl-4 flex items-center shadow-2xl transition-colors group-focus-within:border-cyan-500/50">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full border border-gray-800 mr-3">
                <LinkIcon size={12} className="text-cyan-400"/>
                <span className="text-[10px] font-bold text-gray-300 tracking-wider">SOURCE</span>
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                placeholder="https://example.com or 'A dating app for...'"
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-600"
                autoFocus
              />
              <button onClick={handleStart} className="p-2 bg-cyan-500 text-black hover:bg-cyan-400 rounded-full transition-all">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (viewState === 'generating') {
    return (
      <main className="min-h-screen bg-[#020502] text-white flex flex-col items-center justify-center p-4">
         <CreativeTerminal onComplete={() => setViewState('success')} />
      </main>
    );
  }

  if (viewState === 'success') {
    return (
      <main className="min-h-screen bg-[#020502] text-white flex flex-col items-center justify-center p-4">
         <StitchSuccess onReset={() => { setPrompt(''); setViewState('idle'); }} />
      </main>
    );
  }
  return null;
}
