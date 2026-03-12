import React from 'react';
import Link from 'next/link';
import { Zap, Plus, FolderClock, Settings, ExternalLink } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { desc, eq } from 'drizzle-orm';
import { clones } from '../../db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

type CloneRecord = typeof clones.$inferSelect;

export default async function Dashboard() {
  const { userId } = await auth();
  const safeUserId = userId || 'demo-user-123';

  let recentClones: CloneRecord[] = [];
  try {
    recentClones = await db.select()
      .from(clones)
      .where(eq(clones.userId, safeUserId))
      .orderBy(desc(clones.timestamp))
      .limit(10);
  } catch (error: unknown) {
    console.error('Failed to fetch clones:', error);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans flex">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 bg-[#0A0F14] hidden md:flex flex-col">
        <div className="h-16 border-b border-gray-800 flex items-center px-6 gap-3">
          <Image 
            src="/v-logo.png" 
            alt="VibeClonePro Logo" 
            width={28} 
            height={28} 
          />
          <span className="font-bold text-white text-lg tracking-tight">
            Vibe<span className="text-cyan-400">Clone</span>Pro
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" aria-label="My Projects" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 font-medium">
            <FolderClock size={18} /> My Projects
          </Link>
          <Link href="#" aria-label="Settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors">
            <Settings size={18} /> Settings
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-gray-800 bg-[#0A0F14]/50 backdrop-blur-md flex items-center justify-between px-8">
          <h1 className="text-lg font-bold text-white">Command Center</h1>
          <div className="flex items-center gap-4">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-full border border-gray-700" } }} />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Welcome back.</h2>
                <p className="text-gray-500 text-sm">Deploy a new swarm sequence.</p>
              </div>
              <Link href="/editor" aria-label="New Clone" className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Plus size={18} /> New Clone
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Launch Editor Card */}
              <Link href="/editor" aria-label="Launch Swarm Editor" className="h-48 rounded-xl border-2 border-dashed border-gray-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <span className="font-medium text-gray-400 group-hover:text-cyan-400">Launch Swarm Editor</span>
              </Link>

              {/* Generated Clones */}
              {recentClones.map((clone) => (
                <div key={clone.id} className="h-48 rounded-xl border border-gray-800 bg-[#0A0F14] p-5 flex flex-col justify-between hover:border-cyan-500/30 transition-colors relative group">
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight truncate">{clone.variantName}</h3>
                    <p className="text-gray-500 text-xs mt-2">
                      {clone.timestamp ? new Date(clone.timestamp).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                  <Link 
                    href={clone.previewUrl || '#'} 
                    aria-label={`View code for ${clone.variantName}`}
                    className="inline-flex items-center gap-2 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors"
                  >
                    <ExternalLink size={14} /> View Code
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}