import React from 'react';

const features = [
  {
    title: "The Multi-Model Swarm",
    description: "Don&apos;t rely on one glorified AI intern. VibeClonePro utilizes a fault-tolerant swarm (Gemini, Claude, Grok) that cross-validates intelligence and codes like a senior engineer racing death itself."
  },
  {
    title: "4D OSINT Visualization",
    description: "Turn raw geopolitical data and open-source intelligence into interactive, real-time 4D React components in minutes. Your competition is still looking at flat spreadsheets."
  },
  {
    title: "Unkillable Infrastructure",
    description: "Deploy like you own the internet. Next.js 16, Neon Serverless Postgres, and Upstash background queues. Heavyweight security, featherweight setup. Zero Vercel timeouts."
  },
  {
    title: "You OWN Everything You Build",
    description: "We don&apos;t lease your dreams. Full-stack, database-backed, revenue-ready applications. We hand you the keys, the Next.js codebase, and the launch codes. No hostage fees."
  },
  {
    title: "Built for Founders Who Refuse to Wait",
    description: "No tech cofounder? No problem. Launch full production environments with Clerk auth and Stripe billing preloaded like a sniper&apos;s rifle."
  }
];

export default function FeatureDeck() {
  return (
    <section className="py-24 px-6 bg-[#020305] border-y border-cyan-900/20 relative overflow-hidden">
      {/* Background glow for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-16 tracking-tight uppercase border-l-4 border-cyan-600 pl-6">
          What You&apos;ll Unlock:
        </h2>

        <div className="flex flex-col gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group flex flex-col md:flex-row gap-4 md:gap-6 p-6 md:p-8 rounded-xl bg-[#0A0F14]/80 border border-gray-800 hover:border-cyan-500/40 hover:bg-[#0c1218] transition-all duration-300 shadow-xl"
            >
              <div className="flex-shrink-0 md:mt-1">
                <span className="text-cyan-500 font-mono font-black text-2xl tracking-tighter group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  &gt;&gt;
                </span>
              </div>
              <div>
                <h3 className="inline text-xl md:text-2xl font-bold text-white mr-2">
                  {feature.title}:
                </h3>
                <span className="text-gray-400 md:text-lg leading-relaxed inline">
                  {feature.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
