import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#020502] pt-20 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-900/10 text-cyan-400 text-xs font-mono mb-6">
            <Sparkles size={12}/> LIMITED TIME OFFER
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Elevate your creative workflow</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Choose the engine power that fits your studio needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* STARTER */}
          <div className="p-8 rounded-2xl border border-gray-800 bg-[#0A0F14] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="text-4xl font-bold text-white mb-6">$0<span className="text-sm font-normal text-gray-500">/forever</span></div>
            <button className="w-full py-3 rounded border border-gray-700 text-white hover:bg-gray-800 mb-8 transition-all">Choose Starter</button>
            <ul className="space-y-4 text-sm text-gray-400 flex-1">
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> 3 AI Stitches per month</li>
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Standard Build Queue</li>
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Community Access</li>
            </ul>
          </div>

          {/* PRO */}
          <div className="p-8 rounded-2xl border border-gray-800 bg-[#0A0F14] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <div className="text-4xl font-bold text-white mb-6">$29<span className="text-sm font-normal text-gray-500">/month</span></div>
            <button className="w-full py-3 rounded border border-gray-700 text-white hover:bg-gray-800 mb-8 transition-all">Choose Pro</button>
            <ul className="space-y-4 text-sm text-gray-400 flex-1">
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Unlimited AI Stitches</li>
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Priority Build Queue</li>
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Custom Vibe Presets</li>
            </ul>
          </div>

          {/* LIFETIME (Highlighted) */}
          <div className="relative p-1 rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-400 text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
              Best Value
            </div>
            <div className="h-full p-8 rounded-xl bg-[#05080a] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">Lifetime Access</h3>
                <Sparkles size={20} className="text-cyan-400" />
              </div>
              <p className="text-xs text-cyan-400 mb-4">The ultimate investment</p>
              <div className="text-5xl font-bold text-white mb-1">$499</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">One-time payment</div>
              
              <button className="w-full py-4 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 mb-8 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
                BUY LIFETIME ACCESS
              </button>
              
              <ul className="space-y-4 text-sm text-gray-300 flex-1">
                <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Pay once, own forever</li>
                <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> All future Pro features</li>
                <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> VIP Support</li>
                <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Commercial Rights Included</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
