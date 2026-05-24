'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Send, Bot, User, Loader2, Mic } from 'lucide-react';

export const PREMIUM_MODELS = [
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', provider: 'google' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic' }
];

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const geminiKey = localStorage.getItem('geminiKey');
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          model: selectedModel,
          keys: { geminiKey }
        })
      });

      if (!response.body) throw new Error('No body');

      const asstId = (Date.now() + 1).toString();
      setMessages([...newMessages, { id: asstId, role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              currentContent += JSON.parse(line.substring(2));
            } catch {}
          } else if (!line.startsWith('d:') && !line.startsWith('e:') && line.trim() && !line.match(/^[0-9]:/)) {
            // fallback if it's not strictly formatted
            // it could be standard text
             currentContent += line;
          }
        }
        
        setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: currentContent } : m));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-[350px] border border-cyan-500/30 rounded-xl overflow-hidden bg-[#0A0F14] shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col transition-all">
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
          <div className="flex justify-between items-center px-4 py-2 bg-[#0A0F14] border-b border-gray-800 shrink-0">
            <span className="text-xs text-gray-500 font-medium">Model:</span>
            <select
              title="Select AI Model"
              aria-label="Select AI Model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#050505] text-xs text-cyan-400 border border-gray-800 rounded-md px-2 py-1 outline-none"
            >
              {PREMIUM_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm font-sans">
            {messages.length === 0 ? (
              <div className="text-gray-500 flex flex-col items-center justify-center h-full gap-2 opacity-80">
                <Sparkles size={24} className="text-cyan-500/50" />
                <p>How can I help you prompt today?</p>
              </div>
            ) : (
              messages.map(m => (
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
                    {m.content.split('\n').map((line, i) => (
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
            <div className="flex-1 relative flex items-center">
              <input
                className="w-full bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-lg pl-3 pr-10 py-2 text-sm text-white outline-none transition-colors"
                value={input}
                placeholder="Ask about architecture tips..."
                onChange={handleInputChange}
                title="Message Input"
              />
              <button
                type="button"
                onClick={handleMicClick}
                className={`absolute right-2 p-1.5 rounded-md transition-colors ${
                  isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                }`}
                title="Voice Input"
                aria-label="Voice Input"
              >
                <Mic size={14} />
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
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
