import React from 'react';
import Link from 'next/link';
import { Plus, Terminal, ExternalLink, MoreVertical, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const projects = [
    { 
      id: 1, 
      name: 'Vibe Clone - Airbnb', 
      status: 'Live', 
      url: 'clone.vibe-app.com/x92', 
      lastEdited: '2 mins ago',
      tier: 'Pro'
    },
    { 
      id: 2, 
      name: 'Uber for Dog Walkers', 
      status: 'Building', 
      url: 'pending...', 
      lastEdited: '1 day ago',
      tier: 'Free'
    }
  ];

  return (
    <main className="min-h-screen bg-[#020502] pt-10 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
            <p className="text-gray-400 text-sm">Manage your deployments and billing.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Plus size={16} /> New Clone
          </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-[#0A0F14] border border-gray-800 rounded-xl">
            <div className="text-gray-500 text-xs uppercase mb-2">Total Revenue</div>
            <div className="text-2xl font-mono text-white">$499.00</div>
          </div>
          <div className="p-6 bg-[#0A0F14] border border-gray-800 rounded-xl">
            <div className="text-gray-500 text-xs uppercase mb-2">Active Projects</div>
            <div className="text-2xl font-mono text-cyan-400">2</div>
          </div>
          <div className="p-6 bg-[#0A0F14] border border-gray-800 rounded-xl">
            <div className="text-gray-500 text-xs uppercase mb-2">API Usage</div>
            <div className="text-2xl font-mono text-white">84%</div>
          </div>
        </div>

        {/* PROJECTS GRID */}
        <h2 className="text-white font-bold mb-6 flex items-center gap-2">
          <Terminal size={18} className="text-cyan-500"/> Recent Builds
        </h2>
        
        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="group flex items-center justify-between p-6 bg-[#0A0F14] border border-gray-800 rounded-xl hover:border-cyan-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${project.status === 'Live' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-yellow-500 animate-pulse'}`} />
                <div>
                  <h3 className="text-white font-bold text-lg">{project.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Clock size={12}/> {project.lastEdited}</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">{project.tier}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                  <div className="text-xs text-gray-500 uppercase">Endpoint</div>
                  <div className="text-sm text-cyan-400 font-mono">{project.url}</div>
                </div>
                
                <div className="flex gap-2">
                  <Link href="/editor" className="px-4 py-2 border border-gray-700 text-white rounded hover:bg-gray-800 transition-colors text-sm font-medium">
                    Edit App
                  </Link>
                  <button className="p-2 text-gray-400 hover:text-white"><MoreVertical size={18}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
