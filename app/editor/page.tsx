'use client';
import React, { useState } from 'react';
import { Send, Code, Play, Smartphone, Monitor, Download, ArrowLeft, Settings, Layers } from 'lucide-react';
import Link from 'next/link';

export default function Editor() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Vibe Engine v1.0 initialized. What are we building today?' }
  ]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setPrompt('');
    setIsGenerating(true);

    // Simulate AI thinking (Fake for now)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: 'Analyzing requirements... Generating component structure...' }]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <main className="h-screen bg-[#050505] flex flex-col overflow-hidden text-gray-300 font-sans">
      
      {/* HEADER */}
      <header className="h-14 border-b border-gray-800 bg-[#0A0F14] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <span className="font-bold text-white tracking-wide">Vibe<span className="text-cyan-500">Editor</span></span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">Project: Airbnb Clone</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-800 rounded text-gray-400"><Smartphone size={18}/></button>
          <button className="p-2 bg-gray-800 rounded text-white"><Monitor size={18}/></button>
          <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
          <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-1.5 rounded transition-all">
            <Download size={14} /> Export Code
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: CHAT */}
        <div className="w-[400px] border-r border-gray-800 flex flex-col bg-[#020202]">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-gray-700 text-white'}`}>
                  {msg.role === 'ai' ? <Code size={16} /> : <div className="text-xs font-bold">You</div>}
                </div>
                <div className={`text-sm p-3 rounded-xl max-w-[85%] leading-relaxed ${msg.role === 'ai' ? 'bg-[#0A0F14] border border-gray-800' : 'bg-cyan-600/10 border border-cyan-500/20 text-cyan-100'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-900/30 text-cyan-400 flex items-center justify-center animate-pulse"><Code size={16}/></div>
                <div className="text-sm text-gray-500 flex items-center pt-2">Thinking...</div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-800 bg-[#0A0F14]">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Describe the app you want to build..."
                className="w-full bg-[#050505] border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-cyan-500 text-white resize-none h-24"
              />
              <button 
                onClick={handleSend}
                disabled={!prompt.trim() || isGenerating}
                className="absolute bottom-3 right-3 p-2 bg-cyan-500 text-black rounded hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: PREVIEW */}
        <div className="flex-1 bg-[#101010] flex flex-col items-center justify-center p-8 relative">
          
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-mono flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Live Preview</span>
          </div>

          {/* The "Phone" Container */}
          <div className="w-full max-w-sm h-full max-h-[700px] bg-white rounded-[40px] border-[8px] border-gray-800 overflow-hidden shadow-2xl relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-800 rounded-b-xl z-10"></div>
            
            {/* The Actual "App" (Mock Content) */}
            <div className="h-full w-full bg-gray-50 flex flex-col pt-8">
              {/* Fake App Header */}
              <div className="px-4 py-2 flex justify-between items-center border-b bg-white">
                <span className="font-bold text-lg text-rose-500">airbnb</span>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
              
              {/* Fake App Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Search Bar */}
                <div className="bg-white p-3 rounded-full shadow-sm border flex items-center gap-2 text-gray-400 text-sm">
                  <div className="w-4 h-4 rounded-full border border-gray-400"></div> Where to?
                </div>
                
                {/* Listing Cards */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border">
                    <div className="h-40 bg-gray-200 w-full relative">
                       <div className="absolute top-2 right-2 p-1 bg-white/80 rounded-full">❤</div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between font-bold text-sm">
                        <span>Joshua Tree, CA</span>
                        <span className="flex items-center gap-1">★ 4.9</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-1">145 miles away</div>
                      <div className="text-sm font-semibold mt-2">$245 <span className="font-normal text-gray-500">night</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fake App Nav */}
              <div className="h-16 border-t bg-white flex justify-around items-center text-xs text-gray-400">
                <div className="flex flex-col items-center text-rose-500"><div className="w-5 h-5 bg-rose-500 rounded mb-1"></div>Explore</div>
                <div className="flex flex-col items-center"><div className="w-5 h-5 bg-gray-300 rounded mb-1"></div>Wishlists</div>
                <div className="flex flex-col items-center"><div className="w-5 h-5 bg-gray-300 rounded mb-1"></div>Trips</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
