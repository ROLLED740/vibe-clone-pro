import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-black border-b border-gray-800 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative w-9 h-9 flex-shrink-0 rounded-md overflow-hidden group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
          <Image 
            src="/v-logo.png" 
            alt="VibeClonePro Logo" 
            fill 
            className="object-contain" 
            priority
          />
          {/* The Mix-Blend Overlay: Turns white pixels to exact cyan-400, leaves black alone */}
          <div className="absolute inset-0 bg-cyan-400 mix-blend-multiply pointer-events-none"></div>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          Vibe<span className="text-cyan-400">Clone</span>Pro
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-xs font-mono text-gray-400">
        <Link href="/" className="hover:text-white transition-colors">CLONE ENGINE</Link>
        <Link href="/pricing" className="hover:text-white transition-colors">PRICING TIERS</Link>
        <Link href="/dashboard" className="hover:text-white transition-colors">DASHBOARD</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-xs text-gray-400 hover:text-white font-mono hidden sm:block">
          LOG IN
        </Link>
        <Link href="/pricing" className="px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-cyan-400 transition-colors">
          GET ACCESS
        </Link>
      </div>
    </nav>
  );
}
