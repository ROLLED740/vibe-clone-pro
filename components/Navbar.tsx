import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#05080a] border-b border-gray-800 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold text-black group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
          V
        </div>
        <span className="text-sm font-medium text-white tracking-wide">VibeClonePro</span>
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
