'use client';
import React, { useState } from 'react';
import { Send, Code, Play, Smartphone, Monitor, Download, ArrowLeft, Settings, ChevronDown, Zap, Sparkles, Brain, Bot } from 'lucide-react';
import Link from 'next/link';
// SmartNavbar is handled in layout, but we import specific icons here

export default function Editor() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const models = [
    { name: 'Gemini 1.5 Pro', icon: <Sparkles size={14} className="text-blue-400"/>, description: 'Best for logic & speed' },
    { name: 'Grok 2 (Beta)', icon: <Zap size={14} className="text-white"/>, description: 'Uncensored & creative' },
    { name: 'GPT-4o', icon: <Brain size={14} className="text-green-400"/>, description: 'Standard reasoning' },
    { name: 'Claude 3.5 Sonnet', icon: <Bot size={14} className="text-orange-400"/>, description: 'Top-tier coding' },
  ];

  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Vibe Engine initialized. Select a model and let\'s build.' }
  ]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setPrompt('');
    setIsGenerating(true);

    // Simulate AI Response based on Model
    setTimeout(() => {
      let response = 'Analyzing requirements... Generating component structure...';
      if (selectedModel.includes('Grok')) response = "On it. roasting the old code and deploying the new vibe. 🚀";
      if (selectedModel.includes('Gemini')) response = "Processing with 1M context window. Optimizing React hooks for performance...";
      
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <main className="h-screen bg-[#050505] flex flex-col overflow-hidden text-gray-300 font-sans">
      
      {/* HEADER */}
      <header className="h-14 border-b border-gray-800 bg-[#0A0F14] flex items-center justify-between px-4 z-20 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide hidden md:block">Vibe<span className="text-cyan-500">Editor</span></span>
            <div className="h-4 w-[1px] bg-gray-700 mx-2 hidden md:block"></div>
            
            {/* MODEL SELECTOR */}
            <div className="relative">
              <button 
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-2 bg-[#151b23] hover:bg-[#1c242e] border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all min-w-[140px] justify-between"
              >
                <div className="flex items-center gap-2">
                  {models.find(m => m.name === selectedModel)?.icon}
                  {selectedModel}
                </div>
                <ChevronDown size={12} className={`transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`}/>
              </button>

              {/* DROPDOWN MENU */}
              {isModelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#0A0F14] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  <div className="p-2 space-y-1">
                    {models.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => { setSelectedModel(model.name); setIsModelMenuOpen(false); }}
                        className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${selectedModel === model.name ? 'bg-cyan-900/20 border border-cyan-500/30' : 'hover:bg-[#151b23]'}`}
                      >
                        <div className="mt-0.5">{model.icon}</div>
                        <div>
                          <div className={`text-sm font-medium ${selectedModel === model.name ? 'text-cyan-400' : 'text-gray-200'}`}>{model.name}</div>
                          <div className="text-[10px] text-gray-500">{model.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-1.5 rounded transition-all">
            <Download size={14} /> <span className="hidden md:inline">Export Code</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative" onClick={() => setIsModelMenuOpen(false)}>
        
        {/* LEFT PANEL: CHAT */}
        <div className="w-full md:w-[400px] border-r border-gray-800 flex flex-col bg-[#020202] z-10">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-gray-700 text-white'}`}>
                  {msg.role === 'ai' ? (selectedModel.includes('Grok') ? <Zap size={16}/> : <Code size={16} />) : <div className="text-xs font-bold">You</div>}
                </div>
                <div className={`text-sm p-3 rounded-xl max-w-[85%] leading-relaxed ${msg.role === 'ai' ? 'bg-[#0A0F14] border border-gray-800' : 'bg-cyan-600/10 border border-cyan-500/20 text-cyan-100'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-900/30 text-cyan-400 flex items-center justify-center animate-pulse"><Code size={16}/></div>
                <div className="text-sm text-gray-500 flex items-center pt-2">Thinking via {selectedModel}...</div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-800 bg-[#0A0F14]">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Ask ${selectedModel} to build something...`}
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
        <div className="hidden md:flex flex-1 bg-[#101010] flex-col items-center justify-center p-8 relative">
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-mono flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Live Preview</span>
          </div>
          <div className="w-full max-w-sm h-full max-h-[700px] bg-white rounded-[40px] border-[8px] border-gray-800 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-800 rounded-b-xl z-10"></div>
            <div className="h-full w-full bg-gray-50 flex flex-col pt-8">
              <div className="px-4 py-2 flex justify-between items-center border-b bg-white">
                <span className="font-bold text-lg text-rose-500">airbnb</span>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
