'use client';
import React, { useState } from 'react';
import { Send, Sparkles, Zap, Brain, Bot, ArrowLeft, ChevronDown, Download, Wallet, TrendingUp, Menu, Heart, X as XIcon } from 'lucide-react';
import Link from 'next/link';

// --- TEMPLATES ---
const AirbnbTemplate = () => (
  <div className="h-full w-full bg-gray-50 flex flex-col pt-8 animate-in fade-in duration-500">
    <div className="px-4 py-2 flex justify-between items-center border-b bg-white">
      <span className="font-bold text-lg text-rose-500">airbnb</span>
      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="bg-white p-3 rounded-full shadow-sm border flex items-center gap-2 text-gray-400 text-sm">
        <div className="w-4 h-4 rounded-full border border-gray-400"></div> Where to?
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border">
          <div className="h-40 bg-gray-200 w-full relative">
              <div className="absolute top-2 right-2 p-1 bg-white/80 rounded-full">❤</div>
          </div>
          <div className="p-3">
            <div className="flex justify-between font-bold text-sm">
              <span>Joshua Tree, CA</span>
              <span>★ 4.9</span>
            </div>
            <div className="text-gray-500 text-xs mt-1">145 miles away</div>
            <div className="text-sm font-semibold mt-2">$245 <span className="font-normal text-gray-500">night</span></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CryptoTemplate = () => (
  <div className="h-full w-full bg-[#0d0d0d] text-white flex flex-col pt-8 animate-in fade-in duration-500">
    <div className="px-6 py-4 flex justify-between items-center">
      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">$</div>
      <Wallet size={20} className="text-gray-400"/>
    </div>
    <div className="px-6 mb-6">
      <div className="text-gray-400 text-xs uppercase tracking-wider">Total Balance</div>
      <div className="text-3xl font-bold font-mono mt-1">$124,592.00</div>
      <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
        <TrendingUp size={14}/> +12.5% today
      </div>
    </div>
    <div className="flex-1 bg-[#1a1a1a] rounded-t-[30px] p-6 space-y-4">
      <div className="flex justify-between text-sm font-bold text-gray-500 mb-2"><span>ASSETS</span><span>VALUE</span></div>
      {[
        { n: 'Bitcoin', s: 'BTC', v: '$98,200', c: 'text-white' },
        { n: 'Ethereum', s: 'ETH', v: '$3,400', c: 'text-white' },
        { n: 'Solana', s: 'SOL', v: '$145', c: 'text-white' },
      ].map((c, i) => (
        <div key={i} className="flex justify-between items-center p-4 bg-[#252525] rounded-xl hover:bg-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${i===0 ? 'bg-orange-500': i===1 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
            <div><div className="font-bold">{c.n}</div><div className="text-xs text-gray-400">{c.s}</div></div>
          </div>
          <div className="font-mono">{c.v}</div>
        </div>
      ))}
    </div>
  </div>
);

const DatingTemplate = () => (
  <div className="h-full w-full bg-white flex flex-col pt-8 animate-in fade-in duration-500 relative">
    <div className="px-4 py-2 flex justify-between items-center">
      <div className="text-rose-500 font-bold text-xl">vibe</div>
      <Menu size={20} className="text-gray-400"/>
    </div>
    <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
      <div className="w-full h-[400px] bg-gray-200 rounded-2xl overflow-hidden relative shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
        <div className="absolute bottom-6 left-6 text-white">
          <h2 className="text-3xl font-bold flex items-center gap-2">Sarah, 24 <div className="w-2 h-2 bg-green-500 rounded-full"></div></h2>
          <p className="text-gray-200">Graphic Designer • 2 miles away</p>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-8">
        <button className="w-14 h-14 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"><XIcon size={24}/></button>
        <button className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-400">★</button>
        <button className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl hover:bg-green-400 transition-colors"><Heart size={24} fill="white"/></button>
      </div>
    </div>
  </div>
);

// --- EDITOR ---
export default function Editor() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeApp, setActiveApp] = useState<'airbnb' | 'crypto' | 'dating'>('airbnb');
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const models = [
    { name: 'Gemini 1.5 Pro', icon: <Sparkles size={14} className="text-blue-400"/>, description: 'Best for logic & speed' },
    { name: 'Grok 2 (Beta)', icon: <Zap size={14} className="text-white"/>, description: 'Uncensored & creative' },
    { name: 'GPT-4o', icon: <Brain size={14} className="text-green-400"/>, description: 'Standard reasoning' },
    { name: 'Claude 3.5 Sonnet', icon: <Bot size={14} className="text-orange-400"/>, description: 'Top-tier coding' },
  ];

  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Vibe Engine initialized. Try asking for a "crypto app" or "dating app".' }
  ]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    const userPrompt = prompt.toLowerCase();
    setPrompt('');
    setIsGenerating(true);

    setTimeout(() => {
      let response = 'Updating UI components...';
      if (userPrompt.includes('crypto') || userPrompt.includes('bitcoin')) {
        setActiveApp('crypto');
        response = `Switching context to FinTech. Generating dark-mode charts using ${selectedModel}...`;
      } else if (userPrompt.includes('dating') || userPrompt.includes('tinder')) {
        setActiveApp('dating');
        response = `Building matching algorithm. Deploying swipe interface via ${selectedModel}...`;
      } else {
        setActiveApp('airbnb');
        response = `Restoring travel marketplace template...`;
      }
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <main className="h-screen bg-[#050505] flex flex-col overflow-hidden text-gray-300 font-sans">
      <header className="h-14 border-b border-gray-800 bg-[#0A0F14] flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-white"><ArrowLeft size={18} /></Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white hidden md:block">Vibe<span className="text-cyan-500">Editor</span></span>
            <div className="h-4 w-[1px] bg-gray-700 mx-2 hidden md:block"></div>
            <div className="relative">
              <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-2 bg-[#151b23] border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium text-white min-w-[140px] justify-between">
                <div className="flex items-center gap-2">{models.find(m => m.name === selectedModel)?.icon} {selectedModel}</div>
                <ChevronDown size={12}/>
              </button>
              {isModelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#0A0F14] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 space-y-1">
                    {models.map((m) => (
                      <button key={m.name} onClick={() => {setSelectedModel(m.name); setIsModelMenuOpen(false)}} className="w-full flex gap-3 p-2 hover:bg-[#151b23] rounded-lg text-left">
                        <div className="mt-0.5">{m.icon}</div>
                        <div><div className="text-sm font-medium text-gray-200">{m.name}</div><div className="text-[10px] text-gray-500">{m.description}</div></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-cyan-500 text-black text-xs font-bold px-3 py-1.5 rounded"><Download size={14} /> Export</button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-[400px] border-r border-gray-800 flex flex-col bg-[#020202] z-10">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-gray-700 text-white'}`}>
                  {msg.role === 'ai' ? <Sparkles size={16}/> : <div className="text-xs font-bold">You</div>}
                </div>
                <div className={`text-sm p-3 rounded-xl max-w-[85%] ${msg.role === 'ai' ? 'bg-[#0A0F14] border border-gray-800' : 'bg-cyan-600/10 border border-cyan-500/20 text-cyan-100'}`}>{msg.text}</div>
              </div>
            ))}
            {isGenerating && <div className="text-xs text-gray-500 p-4 animate-pulse">Generating UI...</div>}
          </div>
          <div className="p-4 border-t border-gray-800 bg-[#0A0F14]">
            <div className="relative">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Try 'crypto app' or 'dating app'..." className="w-full bg-[#050505] border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-sm focus:border-cyan-500 text-white resize-none h-24"/>
              <button onClick={handleSend} className="absolute bottom-3 right-3 p-2 bg-cyan-500 text-black rounded"><Send size={16}/></button>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 bg-[#101010] flex-col items-center justify-center p-8 relative">
          <div className="absolute top-4 left-4 px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-mono flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Live Preview</div>
          <div className="w-full max-w-sm h-full max-h-[700px] bg-white rounded-[40px] border-[8px] border-gray-800 overflow-hidden shadow-2xl relative transition-all duration-500">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-800 rounded-b-xl z-10"></div>
            {activeApp === 'airbnb' && <AirbnbTemplate />}
            {activeApp === 'crypto' && <CryptoTemplate />}
            {activeApp === 'dating' && <DatingTemplate />}
          </div>
        </div>
      </div>
    </main>
  );
}
