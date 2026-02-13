'use client';
import React, { useState } from 'react';
import { Send, Play, Download, Settings, ChevronRight } from 'lucide-react';

export default function EditorPage() {
  const [chat, setChat] = useState([
    { role: 'ai', text: 'I have generated the initial architecture. What tweaks do you need?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setChat([...chat, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setChat(prev => [...prev, { role: 'ai', text: 'Optimizing code based on your request... [Applying Fix]' }]);
    }, 1000);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#05080a] text-white font-sans overflow-hidden">
      
      {/* LEFT: File Explorer */}
      <div className="w-64 border-r border-gray-800 bg-[#020502] p-4 hidden md:flex flex-col">
        <div className="text-xs text-gray-500 font-mono mb-4 uppercase">Project Files</div>
        <div className="space-y-1">
          {['page.tsx', 'layout.tsx', 'globals.css', 'components/Navbar.tsx', 'lib/stripe.ts'].map(file => (
            <div key={file} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer py-1">
              <ChevronRight size={12}/> {file}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Code View */}
      <div className="flex-1 flex flex-col border-r border-gray-800">
        <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0A0F14]">
          <span className="text-xs text-cyan-400 font-mono">page.tsx</span>
          <div className="flex gap-2">
             <button className="p-1 hover:text-cyan-400"><Play size={14}/></button>
          </div>
        </div>
        <div className="flex-1 bg-[#0A0F14] p-4 font-mono text-sm text-gray-300 overflow-auto">
          <pre>{`export default function Page() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <p>This is your AI-generated app.</p>
    </div>
  );
}`}</pre>
        </div>
      </div>

      {/* RIGHT: AI Agent Chat */}
      <div className="w-80 bg-[#020502] flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Vibe Pro AI
          </h3>
        </div>
        
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          {chat.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg text-xs leading-relaxed ${msg.role === 'ai' ? 'bg-gray-800 text-gray-200' : 'bg-cyan-900/20 text-cyan-200 border border-cyan-500/20'}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="relative">
            <input 
              className="w-full bg-[#0A0F14] border border-gray-800 rounded p-3 pr-10 text-xs text-white focus:border-cyan-500 outline-none"
              placeholder="Ask AI to change color, add auth..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
