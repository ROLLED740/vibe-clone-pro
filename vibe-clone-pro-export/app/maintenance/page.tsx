import React from 'react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-6 font-sans text-gray-200">
      <div className="max-w-lg w-full bg-[#050505] border border-gray-800 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Animated ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        
        {/* Animated Icon */}
        <div className="relative mb-8 z-10">
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-ping opacity-30"></div>
          <div className="w-20 h-20 bg-[#0A0F14] border border-cyan-500/30 rounded-2xl flex items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <svg className="w-10 h-10 text-cyan-400 animate-[spin_3s_linear_infinite]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight z-10 transition-colors">VibeClonePro is upgrading</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6 z-10 font-medium">
          We are performing rapid emergency maintenance to deploy an important system update. Access will be restored shortly. 
        </p>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full text-xs font-mono text-cyan-400 border border-gray-700 z-10">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          System Ops Active
        </div>
      </div>
    </div>
  );
}
