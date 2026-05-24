'use client';
import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'free' | 'pro'; // Current tier
}

export default function UpgradeModal({ isOpen, onClose, tier }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          {tier === 'free' ? "Free Vibes Exhausted" : "Pro Limit Reached"}
        </h2>
        <p className="text-zinc-400 mb-8">
          You've used your {tier === 'free' ? '5' : '50'} monthly builds. Upgrade now to keep building your vision in the Bunker.
        </p>

        <div className="space-y-4">
          {/* Monthly Pro Link */}
          <a 
            href="https://buy.stripe.com/YOUR_PRO_LINK" 
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition"
          >
            Upgrade to Pro ($29/mo)
          </a>
          
          {/* Lifetime Link */}
          <a 
            href="https://buy.stripe.com/YOUR_LIFETIME_LINK" 
            className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition"
          >
            Get Lifetime Access ($499)
          </a>
        </div>
        
        <p className="text-center text-xs text-zinc-600 mt-6">
          BYOK Architecture: You maintain 100% control over your API costs.
        </p>
      </div>
    </div>
  );
}