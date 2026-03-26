"use client";

import Image from "next/image";
import React, { useState } from "react";
import { createCheckoutSession } from "../actions/stripe";

export default function PricingTable() {
  const [loadingPro, setLoadingPro] = useState(false);
  const [loadingLifetime, setLoadingLifetime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProSubscribe = async () => {
    try {
      setLoadingPro(true);
      setError(null);
      const res = await createCheckoutSession(
        process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro_placeholder"
      );
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error("Error creating subscription checkout:", err);
      setError(err instanceof Error ? err.message : 'Failed to start Pro checkout process');
    } finally {
      setLoadingPro(false);
    }
  };

  const handleLifetimeSubscribe = async () => {
    try {
      setLoadingLifetime(true);
      setError(null);
      const res = await createCheckoutSession(
        process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID || "price_lifetime_placeholder"
      );
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error("Error creating lifetime checkout:", err);
      setError(err instanceof Error ? err.message : 'Failed to start Lifetime checkout process');
    } finally {
      setLoadingLifetime(false);
    }
  };

  return (
    <div className="bg-[#f6f8f8] dark:bg-[#102022] font-['Inter'] text-slate-800 dark:text-slate-200 transition-colors duration-300 min-h-screen flex flex-col">
      <header className="py-12 flex justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg border-2 border-[#13daec] bg-[#13daec]/10">
            <span className="text-[#13daec] text-3xl font-bold">V</span>
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-light tracking-tight text-white">{"VibeClonePro"}</h1>
          <p className="mt-2 text-slate-400 font-light tracking-wide">{"Elevate your creative workflow"}</p>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm max-w-lg text-center">
            {error}
          </div>
        )}
      </header>
      
      <main className="flex-grow flex items-center justify-center px-4 pb-24">
        <div className="max-w-[1400px] w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Starter */}
            <div className="flex flex-col p-8 bg-white/5 border border-white/10 rounded-xl hover:border-[#13daec]/30 transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-medium text-white">Starter</h2>
                <p className="text-slate-400 text-sm mt-1">For personal exploration</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-400 text-sm ml-1">/ forever</span>
              </div>
              <ul className="flex-grow space-y-4 mb-10 text-sm">
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">check_circle</span>
                  <span className="text-slate-300">3 AI Stitches per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">check_circle</span>
                  <span className="text-slate-300">Standard Build Queue</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">check_circle</span>
                  <span className="text-slate-300">Community Access</span>
                </li>
              </ul>
              <button type="button" className="w-full py-3 px-6 rounded-lg border border-[#13daec]/40 text-[#13daec] hover:bg-[#13daec]/10 transition-colors font-medium">
                Choose Starter
              </button>
            </div>
            
            {/* Pro */}
            <div className="flex flex-col p-8 bg-white/5 border border-white/10 rounded-xl hover:border-[#13daec]/30 transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-medium text-white">Pro</h2>
                <p className="text-slate-400 text-sm mt-1">For professionals</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-slate-400 text-sm ml-1">/ month</span>
              </div>
              <ul className="flex-grow space-y-4 mb-10 text-sm">
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">verified</span>
                  <span className="text-slate-300">Unlimited AI Stitches</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">verified</span>
                  <span className="text-slate-300">Priority Build Queue</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">verified</span>
                  <span className="text-slate-300">Custom Vibe Presets</span>
                </li>
              </ul>
              <button 
                type="button"
                onClick={handleProSubscribe}
                disabled={loadingPro}
                className="w-full py-3 px-6 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
              >
                {loadingPro ? "Processing..." : "Choose Pro"}
              </button>
            </div>

            {/* Lifetime */}
            <div className="relative flex flex-col p-8 bg-white/10 border-[3px] border-[#13daec] rounded-xl shadow-[0_0_35px_rgba(19,218,236,0.4)] transform scale-105 z-20">
              <div className="absolute -top-4 right-4 bg-[#13daec] text-[#102022] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Limited Time Offer
              </div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Lifetime Access
                  <span className="material-symbols-outlined text-[#13daec] text-xl">auto_awesome</span>
                </h2>
                <p className="text-[#13daec]/80 text-sm mt-1 font-medium tracking-wide">The ultimate investment</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black text-white">$499</span>
                <span className="text-slate-300 text-xs block mt-1 uppercase tracking-tighter opacity-70">One-time payment</span>
              </div>
              <ul className="flex-grow space-y-4 mb-10 text-sm">
                <li className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-[#13daec] text-xl">all_inclusive</span>
                  <span className="text-white font-semibold">Pay once, own forever</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-[#13daec] text-xl">update</span>
                  <span className="text-white font-semibold">All future Pro features</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-[#13daec] text-xl">support_agent</span>
                  <span className="text-white font-semibold">VIP Support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-[#13daec] text-xl">workspace_premium</span>
                  <span className="text-white font-semibold">Exclusive Beta Access</span>
                </li>
              </ul>
              <div className="space-y-3">
                <button 
                  type="button" 
                  onClick={handleLifetimeSubscribe}
                  disabled={loadingLifetime}
                  className="w-full py-4 px-6 rounded-lg bg-[#13daec] text-[#102022] hover:brightness-110 transition-all font-black shadow-[0_0_25px_rgba(19,218,236,0.6)] uppercase tracking-wider text-sm flex flex-col items-center justify-center disabled:opacity-50"
                >
                  <span>{loadingLifetime ? "Processing..." : "Buy Lifetime"}</span>
                  <span className="text-[10px] opacity-70 font-bold mt-0.5 flex items-center gap-1">
                    <span className="material-icons text-[12px]">lock</span>
                    Securely via Stripe
                  </span>
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium">Redirects to official checkout</p>
              </div>
            </div>

            {/* Enterprise */}
            <div className="flex flex-col p-8 bg-white/5 border border-white/10 rounded-xl hover:border-[#13daec]/30 transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-medium text-white">Enterprise</h2>
                <p className="text-slate-400 text-sm mt-1">For larger teams</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">Custom</span>
                <span className="text-slate-400 text-sm ml-1">/ year</span>
              </div>
              <ul className="flex-grow space-y-4 mb-10 text-sm">
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">check_circle</span>
                  <span className="text-slate-300">White-label Integration</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">check_circle</span>
                  <span className="text-slate-300">API Access &amp; Webhooks</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="material-icons text-[#13daec] text-lg">check_circle</span>
                  <span className="text-slate-300">Dedicated Account Manager</span>
                </li>
              </ul>
              <button type="button" className="w-full py-3 px-6 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors font-medium">
                Contact Sales
              </button>
            </div>
          </div>

          <div className="mt-24 text-center">
            <p className="text-slate-500 text-sm font-light">All plans include secure data encryption and automated backups.</p>
            <div className="mt-8 flex justify-center space-x-8">
              <div className="flex items-center space-x-3 grayscale opacity-50 hover:opacity-80 transition-opacity">
                <Image 
                  alt="Stripe Logo" 
                  className="h-5 w-auto" 
                  width={50}
                  height={20}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3Nr0Utq6nxx7TKmzFVcaGOyzwsBLmaWKWoSJPFAIjATXs1GN_o5ko5yRH1FToPOqJPNbpQbGSyJ0d6Peg2t_WUAriAxgFH4MmAgsZAU0x0bL3NWNOfcUt0ZfCnXgyKGkUsOqal19NhQt9ywNVUq40mZ62OadXcty-AviZqU8yEcNf796N8Fzr6R2-_KJhOqOc07bXmw3-4AyZfcWGdThOKwORsoTTy-20ZExFgENXT2OTfZkQCr7TMeu6h4OaDnlIm1WQ1zKs2Q"
                />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Official Payment Partner</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-10 border-t border-white/5 text-center">
        <div className="text-slate-600 text-[10px] tracking-[0.15em] uppercase flex flex-col md:flex-row justify-center items-center gap-6">
          <a className="hover:text-[#13daec] transition-colors" href="#">Privacy Policy</a>
          <span className="hidden md:inline text-white/10">•</span>
          <a className="hover:text-[#13daec] transition-colors" href="#">Terms of Service</a>
          <span className="hidden md:inline text-white/10">•</span>
          <span>© 2026 VibeClonePro Inc.</span>
        </div>
      </footer>
    </div>
  );
}
