'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Zap, Sparkles, X, ChevronRight, Loader2, Code2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Sandpack } from '@codesandbox/sandpack-react';

const loadingSteps = [
  "Extracting Vision constraints...",
  "Routing payload to models...",
  "Generating Next.js Architecture...",
  "Applying robust Tailwind styles...",
  "Finalizing code and saving to DB..."
];

export default function Editor() {
  const [idea, setIdea] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [results, setResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCloning) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => prev < loadingSteps.length - 1 ? prev + 1 : prev);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isCloning]);

  const cancelSwarm = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsCloning(false);
    setErrorToast("Swarm sequence aborted manually.");
  };

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
    setErrorToast(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: [{ idea, imageBase64 }]
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();

      if (response.status === 202 && data.cloneId) {
        // QStash Background processing initiated
        const cloneId = data.cloneId;
        
        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/clone/${cloneId}`);
            
            // 404 means the background job hasn't inserted the record yet
            if (statusRes.status === 404) return;
            
            if (statusRes.ok) {
               const statusData = await statusRes.json();
               
               if (statusData.status === 'completed' && statusData.data) {
                 if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                 // Assuming the array of records is returned, map the generatedCode
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 const generatedCodes = statusData.data.map((c: any) => c.generatedCode);
                 setResults(generatedCodes);
                 setIsCloning(false);
               } else if (statusData.status === 'failed') {
                 if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                 setErrorToast('Swarm generation failed during processing.');
                 setIsCloning(false);
               }
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
          }
        }, 3000);

      } else if (data.success && data.codes) {
        // Synchronous fallback (if not 202)
        setResults(data.codes);
        setIsCloning(false);
      } else {
        setErrorToast('Swarm encountered an anomaly: ' + (data.error || 'Unknown error'));
        setIsCloning(false);
      }
    } catch (error: unknown) {
      console.error('Clone failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        // Handled by cancelSwarm
      } else {
        setErrorToast('Failed to connect to VibeClone API. Request timed out or servers are busy.');
      }
      setIsCloning(false);
    } finally {
      abortControllerRef.current = null;
      // Note: We don't set isCloning(false) here because polling might be active
    }
  };

  return (
    <main className="h-screen bg-[#050505] flex flex-col overflow-hidden text-gray-300 font-sans relative">
      {errorToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 w-max max-w-[90vw]">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="text-sm font-medium">{errorToast}</span>
            <button aria-label="Dismiss error" onClick={() => setErrorToast(null)} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors ml-4 shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <header className="h-14 border-b border-gray-800 bg-[#0A0F14] flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors" title="Back to Dashboard">
            <ChevronRight size={18} className="rotate-180" />
          </Link>
          <div className="flex items-center gap-2">
            <Image 
              src="/v-logo.png" 
              alt="VibeClonePro Logo" 
              width={24} 
              height={24} 
            />
            <span className="font-bold text-white text-sm tracking-wide">Swarm<span className="text-cyan-400">Editor</span></span>
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
                  title="Upload UI Image"
                >
                  <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="text-sm font-medium">Drop UI Image</span>
                </button>
              ) : (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-700 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Target UI" className="w-full h-full object-cover opacity-80" />
                  <button aria-label="Clear image" title="Clear image" onClick={clearImage} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 text-white rounded-lg backdrop-blur transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
              <input aria-label="Upload interface image" title="Upload interface image" type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>

            <div className="h-px w-full bg-gray-800" />

            <div>
              <h2 className="text-white font-bold mb-2 flex items-center gap-2"><Code2 size={16} className="text-cyan-500" /> Architecture Prompt</h2>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. Build a pricing page with 3 tiers and a glowing CTA..."
                className="w-full h-32 bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-xl p-3 text-sm text-white resize-none outline-none transition-colors"
                aria-label="Architecture Prompt"
                title="Architecture Prompt"
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
              title="Launch Clone Sequence"
            >
              {isCloning ? <><Loader2 size={18} className="animate-spin" /> Swarm Engaged...</> : <><Zap size={18} /> Launch Clone Sequence</>}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW OR CUSTOM LOADING STATE */}
        <div className="flex-1 bg-[#020202] relative flex flex-col">
          {isCloning ? (
            <div className="flex-1 flex flex-col items-center justify-center z-10 p-6 text-center animate-in fade-in duration-500 relative">
              <div className="w-24 h-24 mb-6 relative flex items-center justify-center rounded-full bg-black border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/loading-vibe.gif" alt="Swarm Processing" className="w-[120%] h-[120%] object-cover object-center" />
              </div>
              <h2 className="text-xl font-bold text-cyan-400 mb-2 animate-pulse">Synchronizing AI Swarm...</h2>
              
              <div className="h-8 flex items-center justify-center overflow-hidden mb-6">
                 <p className="text-gray-400 text-sm font-medium animate-in slide-in-from-bottom-2 fade-in duration-300" key={loadingStep}>
                   {loadingSteps[loadingStep]}
                 </p>
              </div>

              <button 
                onClick={cancelSwarm}
                className="mt-4 px-6 py-2.5 rounded-lg border border-red-500/30 text-red-500 font-medium hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <X size={16} /> Cancel Sequence
              </button>
            </div>
          ) : results.length > 0 ? (
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
                    title={"View " + name}
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