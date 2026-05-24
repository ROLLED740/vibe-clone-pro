'use client';

import React, { useState, useRef } from 'react';
import { Upload, Zap, Sparkles, X, ChevronRight, Loader2, Code2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Sandpack } from '@codesandbox/sandpack-react';
import CopilotChat from '../../components/editor/CopilotChat';
import { triggerSwarmAction } from '../actions/swarm';

export default function Editor() {
  const [idea, setIdea] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCode, setActiveCode] = useState<string>(`export default function App() { return <div className="p-10 bg-black text-cyan-400 font-mono flex items-center justify-center h-screen uppercase tracking-widest text-2xl border-2 border-cyan-400">AWAITING SWARM INJECTION...</div> }`);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerSwarm = async () => {
    if (!idea.trim() && !imageBase64) return;

    setIsCloning(true);
    setErrorToast(null);

    // Instrument panel loading state
    setActiveCode(`export default function App() { return <div className="p-10 bg-[#050505] text-cyan-500 font-mono flex items-center justify-center h-screen animate-pulse uppercase tracking-widest border border-cyan-500/20 shadow-[0_0_40px_rgba(0,255,255,0.1)]">Swarm generation active... (Inngest event dispatched)</div> }`);

    try {
      const payload = {
        userId: "demo-user-123", // Non-Clerk fallback purely for the sandbox
        prompt: idea,
        provider: "google"
      };

      const resultString = await triggerSwarmAction(payload);
      setActiveCode(resultString);
    } catch (error: unknown) {
      console.error('Clone failed:', error);
      setErrorToast('Failed to trigger Inngest event.');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <main className="h-screen bg-[#000000] flex flex-col overflow-hidden text-cyan-400 font-mono relative">
      {errorToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 px-4 py-3 shadow-[0_0_20px_rgba(0,255,255,0.2)] flex items-center gap-3 w-max max-w-[90vw]">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="text-sm font-medium">{errorToast}</span>
            <button aria-label="Dismiss error" onClick={() => setErrorToast(null)} className="p-1 hover:bg-cyan-500/20 transition-colors ml-4 shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <header className="h-14 border-b border-cyan-900/50 bg-[#000000] flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-cyan-500 hover:text-cyan-300 transition-colors" title="Back to Dashboard">
            <ChevronRight size={18} className="rotate-180" />
          </Link>
          <div className="flex items-center gap-2">
            <Image 
              src="/v-logo.png" 
              alt="VibeClonePro Logo" 
              width={24} 
              height={24} 
              className="filter brightness-0 sepia hue-rotate-180 saturate-200"
            />
            <span className="font-bold text-cyan-400 text-sm tracking-[0.2em] uppercase">Swarm<span className="text-white">Engine</span></span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: CONTROLS */}
        <div className="w-full md:w-[400px] border-r border-cyan-900/50 flex flex-col bg-[#050505] z-10 shrink-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-cyan-500 font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-sm"><Sparkles size={16} /> Target Vision</h2>
              
              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-cyan-900/50 hover:border-cyan-500 bg-black hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-2 text-cyan-700 hover:text-cyan-400 group focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  title="Upload UI Image"
                >
                  <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="text-sm font-medium uppercase tracking-widest">Connect Matrix</span>
                </button>
              ) : (
                <div className="relative w-full h-40 overflow-hidden border border-cyan-500 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Target UI" className="w-full h-full object-cover opacity-80" />
                  <button aria-label="Clear image" title="Clear image" onClick={clearImage} className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-500/80 text-cyan-400 hover:text-white backdrop-blur transition-colors border border-cyan-500/50">
                    <X size={14} />
                  </button>
                </div>
              )}
              <input aria-label="Upload interface image" title="Upload interface image" type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>

            <div className="h-px w-full bg-cyan-900/30" />

            <div>
              <h2 className="text-cyan-500 font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-sm"><Code2 size={16} /> Architecture Directives</h2>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="INPUT DIRECTIVES..."
                className="w-full h-32 bg-[#000000] border border-cyan-900/50 focus:border-cyan-500 p-3 text-sm text-cyan-400 resize-none outline-none transition-colors uppercase tracking-wide"
                aria-label="Architecture Prompt"
                title="Architecture Prompt"
              />
            </div>

            </div>

          <div className="p-4 border-t border-cyan-900/50 bg-[#000000]">
            <button
              onClick={triggerSwarm}
              disabled={isCloning || (!idea && !imageBase64)}
              className={`w-full py-4 font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest border ${isCloning
                ? 'bg-cyan-900/10 border-cyan-900 text-cyan-700 cursor-not-allowed'
                : (!idea && !imageBase64)
                  ? 'bg-black border-cyan-900/50 text-cyan-900 cursor-not-allowed'
                  : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_20px_rgba(0,255,255,0.2)]'
                }`}
              title="Launch Sequence"
            >
              {isCloning ? <><Loader2 size={18} className="animate-spin" /> ENGAGED</> : <><Zap size={18} /> INITIALIZE SEQUENCE</>}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DETERMINISTIC SANDPACK ENGINE */}
        <div className="flex-1 bg-[#000000] relative flex flex-col p-6 shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex-1 border border-cyan-900/50 overflow-hidden bg-[#000000]">
                <Sandpack
                  template="react-ts"
                  theme={{
                    colors: {
                      surface1: "#000000",
                      surface2: "#050505",
                      surface3: "#0A0A0A",
                      clickable: "#00FFFF",
                      base: "#00FFFF",
                      disabled: "#004444",
                      hover: "#FFFFFF",
                      accent: "#00FFFF",
                      error: "#FF0000",
                      errorSurface: "#220000",
                    },
                    syntax: {
                      plain: "#00FFFF",
                      comment: { color: "#006666", fontStyle: "italic" },
                      keyword: "#FFFFFF",
                      tag: "#AAAAAA",
                      punctuation: "#00CCCC",
                      definition: "#00FFFF",
                      property: "#00FFFF",
                      static: "#00FFFF",
                      string: "#FFFFFF",
                    },
                    font: {
                      body: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      size: "13px",
                      lineHeight: "20px"
                    }
                  }}
                  files={{
                    "/App.tsx": activeCode,
                    "/public/index.html": `<!DOCTYPE html>
                      <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Live Preview</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                        </head>
                        <body class="bg-[#000000]">
                          <div id="root"></div>
                        </body>
                      </html>`,
                  }}
                  customSetup={{
                    dependencies: {
                      "lucide-react": "latest",
                      "framer-motion": "latest",
                    }
                  }}
                  options={{
                    showNavigator: true,
                    showTabs: true,
                    editorHeight: "100%",
                    editorWidthPercentage: 45,
                  }}
                />
            </div>
        </div>

      </div>
      {/* VibeClone Copilot Integration */}
      <CopilotChat />
    </main>
  );
}