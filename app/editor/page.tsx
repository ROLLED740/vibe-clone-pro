'use client';

import React, { useState, useRef } from 'react';
import { Upload, Zap, Sparkles, X, ChevronRight, Loader2, Code2 } from 'lucide-react';
import Link from 'next/link';
import { Sandpack } from '@codesandbox/sandpack-react';

export default function Editor() {
  const [idea, setIdea] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [results, setResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const variantNames = ['Original Vibe', 'Thicc & Bold', 'Ethereal Glow'];

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
    setResults([]);

    try {
      const response = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: [{ idea, imageBase64 }]
        }),
      });

      const data = await response.json();

      if (data.success && data.codes) {
        setResults(data.codes);
      } else {
        alert('Swarm encountered an anomaly: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Clone failed:', error);
      alert('Failed to connect to VibeClone API.');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <main className="h-screen bg-[#050505] flex flex-col overflow-hidden text-gray-300 font-sans">
      <header className="h-14 border-b border-gray-800 bg-[#0A0F14] flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
            <ChevronRight size={18} className="rotate-180" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-black">V</div>
            <span className="font-bold text-white text-sm tracking-wide">Swarm<span className="text-cyan-500">Editor</span></span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: CONTROLS */}
        <div className="w-full md:w-[400px] border-r border-gray-800 flex flex-col bg-[#0A0F14] z-10 shrink-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-white font-bold mb-2 flex items-center gap-2"><Sparkles size={16} className="text-cyan-500" /> Extract Vibe (Vision AI)</h2>
              <p className="text-xs text-gray-500 mb-4">Upload a screenshot. The AI will extract the exact color palette, typography, and layout.</p>

              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-cyan-400 group"
                >
                  <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="text-sm font-medium">Drop UI Image</span>
                </button>
              ) : (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-700 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Target UI" className="w-full h-full object-cover opacity-80" />
                  <button aria-label="Clear image" onClick={clearImage} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-lg backdrop-blur transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
              <input aria-label="Upload interface image" type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>

            <div className="h-px w-full bg-gray-800" />

            <div>
              <h2 className="text-white font-bold mb-2 flex items-center gap-2"><Code2 size={16} className="text-cyan-500" /> Architecture Prompt</h2>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. Build a pricing page with 3 tiers and a glowing CTA..."
                className="w-full h-32 bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-xl p-3 text-sm text-white resize-none outline-none transition-colors"
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-800 bg-[#050505]">
            <button
              onClick={triggerSwarm}
              disabled={isCloning || (!idea && !imageBase64)}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isCloning
                ? 'bg-cyan-900/50 text-cyan-500 cursor-not-allowed'
                : (!idea && !imageBase64)
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                }`}
            >
              {isCloning ? <><Loader2 size={18} className="animate-spin" /> Swarm Engaged...</> : <><Zap size={18} /> Launch Clone Sequence</>}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW OR CUSTOM LOADING STATE */}
        <div className="flex-1 bg-[#020202] relative flex flex-col">
          {isCloning ? (
            // CUSTOM GIF LOADING SCREEN (FIXED SCALE & RESOLUTION)
            <div className="flex-1 flex flex-col items-center justify-center z-10 p-6 text-center animate-in fade-in duration-500">
              {/* Shrinking container to 96px (w-24), masking as a perfect circle, adding premium glow */}
              <div className="w-24 h-24 mb-6 relative flex items-center justify-center rounded-full bg-black border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/loading-vibe.gif" alt="Swarm Processing" className="w-[120%] h-[120%] object-cover object-center" />
              </div>
              <h2 className="text-xl font-bold text-cyan-400 mb-2 animate-pulse">Synchronizing AI Swarm...</h2>
              <p className="text-gray-500 max-w-sm text-sm">
                Extracting visual footprint. Routing payload to Claude 3.5 Sonnet and compiling Next.js architecture. Please stand by.
              </p>
            </div>
          ) : results.length > 0 ? (
            // COMPLETED SANDPACK SCREEN
            <div className="flex-1 flex flex-col p-6 z-10 h-full">
              <div className="flex items-center gap-2 mb-4 bg-[#0A0F14] p-1.5 rounded-xl border border-gray-800 w-max">
                {variantNames.map((name, idx) => (
                  <button
                    key={name}
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === idx
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                      }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="flex-1 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl bg-[#0A0F14] min-h-[500px]">
                <Sandpack
                  template="react-ts"
                  theme="dark"
                  files={{
                    "/App.tsx": results[activeTab] || `export default function App() { return <div className="p-10 text-white font-sans">Generating layout...</div> }`,
                    "/public/index.html": `<!DOCTYPE html>
                      <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Live Preview</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                        </head>
                        <body class="bg-[#050505]">
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
          ) : (
            // DEFAULT EMPTY STATE
            <div className="flex-1 flex flex-col items-center justify-center z-10 p-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Zap size={32} className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Live Compilation Ready</h2>
              <p className="text-gray-500 max-w-md text-sm">
                Upload a target UI and prompt your architecture. The swarm will generate the code and compile it instantly in this window.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}