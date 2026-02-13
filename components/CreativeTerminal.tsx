import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

const MESSAGES = [
  "Initializing neural canvas...",
  "Scraping target architecture...",
  "Refactoring UI vectors...",
  "Injecting payment gateway...",
  "Applying legal wrappers...",
  "Finalizing build..."
];

export const CreativeTerminal = ({ onComplete }: { onComplete?: () => void }) => {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (index >= MESSAGES.length - 1) {
      if (onComplete) setTimeout(onComplete, 1000);
      return;
    }
    const timeout = setTimeout(() => setIndex(prev => prev + 1), 1500);
    return () => clearTimeout(timeout);
  }, [index, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(old => (old >= 100 ? 100 : old + 1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">
      <div className="relative w-full bg-[#020502] border-4 border-[#1a3b1a] rounded-2xl shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)] overflow-hidden">
        <div className="bg-[#0f220f] px-4 py-3 flex justify-between items-center border-b border-[#1a3b1a]">
          <div className="flex items-center gap-2 text-[#4ade80]">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold tracking-widest uppercase">Secure Offline Core</span>
          </div>
        </div>
        <div className="relative p-8 h-64 flex flex-col items-center justify-center bg-black">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 animate-pulse" />
            <Cpu size={48} className="text-[#4ade80] relative z-20" />
          </div>
          <div className="h-8 flex items-center justify-center w-full relative z-20">
             <span className="font-mono text-[#22c55e] text-lg">{MESSAGES[index]}</span>
          </div>
          <div className="w-full h-1 bg-[#111f11] mt-8 rounded-full overflow-hidden relative z-20">
            <div className="h-full bg-[#22c55e] shadow-[0_0_10px_#22c55e] transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
