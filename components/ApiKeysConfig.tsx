'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface ApiKeysConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeysConfig({ isOpen, onClose }: ApiKeysConfigProps) {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [grokKey, setGrokKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnthropicKey(localStorage.getItem('anthropicKey') || '');
      setOpenAiKey(localStorage.getItem('openAiKey') || '');
      setGeminiKey(localStorage.getItem('geminiKey') || '');
      setGrokKey(localStorage.getItem('grokKey') || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('anthropicKey', anthropicKey);
    localStorage.setItem('openAiKey', openAiKey);
    localStorage.setItem('geminiKey', geminiKey);
    localStorage.setItem('grokKey', grokKey);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl w-[400px] shadow-2xl relative">
        <button
          onClick={onClose}
          title="Close configuration"
          aria-label="Close configuration"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Anthropic API Key</label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-lg p-2.5 text-white text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={openAiKey}
              onChange={(e) => setOpenAiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-lg p-2.5 text-white text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Gemini API Key</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-lg p-2.5 text-white text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Grok API Key</label>
            <input
              type="password"
              value={grokKey}
              onChange={(e) => setGrokKey(e.target.value)}
              placeholder="xai-..."
              className="w-full bg-[#050505] border border-gray-700 focus:border-cyan-500 rounded-lg p-2.5 text-white text-sm outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 rounded-lg transition-colors"
          >
            <Save size={18} /> Save Keys
          </button>
        </div>
      </div>
    </div>
  );
}
