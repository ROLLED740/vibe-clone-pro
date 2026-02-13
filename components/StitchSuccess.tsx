import React, { useState } from 'react';
import { ExternalLink, DollarSign, Copy, ShieldCheck } from 'lucide-react';

export const StitchSuccess = ({ onReset }: { onReset: () => void }) => {
  const [monetizationActive, setMonetizationActive] = useState(false);

  const toggleMonetization = async () => {
    // In production, this fetches the backend stripe route
    setMonetizationActive(!monetizationActive);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in zoom-in duration-500 flex flex-col items-center">
      
      {/* THE VIBRATING V LOGO */}
      <div className="relative mb-12 group">
        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-60 animate-pulse duration-75" />
        <div className="relative w-20 h-20 bg-black border border-cyan-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)] z-10">
          <span className="text-5xl font-bold text-cyan-400 font-sans">V</span>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">System Deployment Complete</h2>
        <p className="text-gray-400 font-mono text-sm">Commercial license generated. Ready for revenue.</p>
      </div>

      <div className="w-full bg-[#0A0F14] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#05080a]">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
             <span className="text-xs font-mono text-green-500 uppercase">Live Network</span>
          </div>
          <button 
            onClick={toggleMonetization}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              monetizationActive 
              ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign size={14} />
            {monetizationActive ? 'PAYMENT GATEWAY ACTIVE' : 'ENABLE PAYMENTS'}
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Public Endpoint</label>
              <div className="flex gap-2 mt-2">
                <code className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm text-cyan-400 font-mono flex items-center">
                  https://clone.vibe-app.com/x92
                </code>
                <button className="p-3 hover:bg-gray-800 rounded-lg text-gray-400 border border-transparent hover:border-gray-700"><Copy size={18}/></button>
              </div>
            </div>
            {monetizationActive && (
              <div className="p-4 bg-cyan-900/10 border border-cyan-500/30 rounded-xl">
                <h4 className="text-sm text-cyan-400 font-bold mb-1 flex items-center gap-2"><ShieldCheck size={14}/> Merchant Record Active</h4>
                <p className="text-xs text-cyan-200/60">Stripe Checkout injected. Users must subscribe to access.</p>
              </div>
            )}
            <button className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <ExternalLink size={18} /> OPEN LIVE APP
            </button>
          </div>
          <div className="bg-black rounded-xl border border-gray-800 p-4 font-mono text-xs relative overflow-hidden h-64">
            <pre className="text-gray-300">
{`export const config = {
  merchantId: "${monetizationActive ? 'acct_1N9x...' : 'pending...'}",
  currency: "USD",
  products: [{ id: "prod_H29s...", price: 2900 }],
  copyright: "© 2026 Clone Enterprise."
}`}
            </pre>
          </div>
        </div>
        <div className="bg-[#05080a] border-t border-gray-800 p-4 text-center">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
            SECURE TRANSACTION PROTOCOL • LEGAL BINDING ENABLED • © 2026 VIBECLONE INC
          </p>
        </div>
      </div>
      <div className="text-center mt-8">
        <button onClick={onReset} className="text-xs text-gray-600 hover:text-cyan-500 font-mono">[ INITIALIZE NEW SEQUENCE ]</button>
      </div>
    </div>
  );
};
