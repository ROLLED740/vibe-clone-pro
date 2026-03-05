'use client';
import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import CheckoutModal from '@/components/CheckoutModal';

export default function PricingPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(0);
  // Add state to track which tier is clicked
  const [activeTier, setActiveTier] = useState<string>('lifetime');

  const handleBuy = (price: number, tierName: string) => {
    setActiveTier(tierName);
    setSelectedPrice(price);
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#020502] pt-20 pb-20 px-4">
      <CheckoutModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        price={selectedPrice} 
      />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Elevate your creative workflow</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Choose the engine power that fits your studio needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* STARTER */}
          <div 
            onClick={() => setActiveTier('starter')}
            className={`cursor-pointer p-8 rounded-2xl flex flex-col transition-all duration-300 ${activeTier === 'starter' ? 'border-2 border-cyan-500 bg-[#0A0F14] shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border border-gray-800 bg-[#0A0F14]/50 opacity-80'}`}
          >
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="text-4xl font-bold text-white mb-6">$0<span className="text-sm font-normal text-gray-500">/forever</span></div>
            <button className="w-full py-3 rounded border border-gray-700 text-white hover:bg-gray-800 mb-8 transition-all">Current Plan</button>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> 3 AI Stitches per month</li>
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Standard Build Queue</li>
            </ul>
          </div>

          {/* PRO */}
          <div 
            onClick={() => setActiveTier('pro')}
            className={`cursor-pointer p-8 rounded-2xl flex flex-col transition-all duration-300 ${activeTier === 'pro' ? 'border-2 border-cyan-500 bg-[#0A0F14] shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'border border-gray-800 bg-[#0A0F14]/50 opacity-80'}`}
          >
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <div className="text-4xl font-bold text-white mb-6">$29<span className="text-sm font-normal text-gray-500">/month</span></div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleBuy(29, 'pro'); }}
              className={`w-full py-3 rounded text-white font-bold mb-8 transition-all ${activeTier === 'pro' ? 'bg-cyan-500 text-black hover:bg-cyan-400' : 'border border-gray-700 hover:bg-gray-800'}`}
            >
              Choose Pro
            </button>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Unlimited AI Stitches</li>
              <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Priority Build Queue</li>
            </ul>
          </div>

          {/* LIFETIME */}
          <div 
            onClick={() => setActiveTier('lifetime')}
            className={`cursor-pointer relative p-1 rounded-2xl transition-all duration-300 ${activeTier === 'lifetime' ? 'bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'bg-gray-800 opacity-80'}`}
          >
            {activeTier === 'lifetime' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-400 text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
                Best Value
              </div>
            )}
            <div className="h-full p-8 rounded-xl bg-[#05080a] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">Lifetime Access</h3>
                <Sparkles size={20} className={activeTier === 'lifetime' ? 'text-cyan-400' : 'text-gray-500'} />
              </div>
              <div className="text-5xl font-bold text-white mb-1">$499</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">One-time payment</div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleBuy(499, 'lifetime'); }}
                className={`w-full py-4 rounded font-bold mb-8 transition-all ${activeTier === 'lifetime' ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border border-gray-700 text-white hover:bg-gray-800'}`}
              >
                BUY LIFETIME ACCESS
              </button>
              
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Pay once, own forever</li>
                <li className="flex gap-3"><Check size={16} className="text-cyan-500"/> Commercial Rights Included</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}