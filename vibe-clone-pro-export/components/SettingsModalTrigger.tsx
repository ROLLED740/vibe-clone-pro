'use client';

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import ApiKeysConfig from './ApiKeysConfig';

export default function SettingsModalTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Settings" 
        className="w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
      >
        <Settings size={18} /> Settings
      </button>
      <ApiKeysConfig isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
