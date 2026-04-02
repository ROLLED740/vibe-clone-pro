'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Sparkles, ChevronDown, ChevronUp, Send, Bot, User, Loader2 } from 'lucide-react';

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/copilot',
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <div className="w-full border border-cyan-500/30 rounded-xl overflow-hidden bg-[#0A0F14] shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer outline-none"
        aria-label="Toggle Copilot Chat"
        title="Toggle Copilot Chat"
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          <Sparkles size={16} />
          VibeClone Copilot
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <div className="flex flex-col border-t border-cyan-500/30 bg-[#050505] h-[350px]">
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm font-sans">
            {messages.length === 0 ? (
              <div className="text-gray-500 flex flex-col items-center justify-center h-full gap-2 opacity-80">
                <Sparkles size={24} className="text-cyan-500/50" />
                <p>How can I help you prompt today?</p>
              </div>
            ) : (
              messages.map((m: {id: string, role: string, content: string}) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className={`p-3 rounded-xl max-w-[85%] ${
                    m.role === 'user' 
                      ? 'bg-gray-800 text-white rounded-tr-sm' 
                      : 'bg-[#0A0F14] border border-cyan-500/20 text-gray-300 rounded-tl-sm'
                  }`}>
                    {/* Minimal markdown rendering - render breaks as breaks */}
                    {m.content.split('\n').map((line: string, i: number) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3 justify-start">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-xl bg-[#0A0F14] border border-cyan-500/20 text-gray-300 rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-cyan-500" />
                  <span className="text-gray-500 text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800 bg-[#0A0F14] flex gap-2 shrink-0">
            <input
              className="flex-1 bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
              value={input}
              placeholder="Ask about architecture tips..."
              onChange={handleInputChange}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send Copilot Message"
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
