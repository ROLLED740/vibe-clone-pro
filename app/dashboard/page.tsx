'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Plus, FolderClock, Settings } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans flex">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 bg-[#0A0F14] flex flex-col hidden md:flex">
        <div className="h-16 border-b border-gray-800 flex items-center px-6 gap-3">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-black">V</div>
          <span className="font-bold text-white tracking-wide">Vibe<span className="text-cyan-500">Clone</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 font-medium">
            <FolderClock size={18} /> My Projects
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors">
            <Settings size={18} /> Settings
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-gray-800 bg-[#0A0F14]/50 backdrop-blur-md flex items-center justify-between px-8">
          <h1 className="text-lg font-bold text-white">Command Center</h1>
          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700"></div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Welcome back.</h2>
                <p className="text-gray-500 text-sm">Deploy a new swarm sequence.</p>
              </div>
              <Link href="/editor" className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Plus size={18} /> New Clone
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Launch Editor Card */}
              <Link href="/editor" className="h-48 rounded-xl border-2 border-dashed border-gray-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <span className="font-medium text-gray-400 group-hover:text-cyan-400">Launch Swarm Editor</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}