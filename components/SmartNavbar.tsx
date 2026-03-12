'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';

export default function SmartNavbar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  
  // LOGIC: If we are on the Dashboard or Editor, hide this global header
  // so the app's own interface can take over.
  if (pathname?.includes('/dashboard') || pathname?.includes('/editor')) {
    return null;
  }

  return (
    <nav className="border-b border-gray-800 bg-black p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 flex-shrink-0 rounded-md overflow-hidden">
          <Image 
            src="/v-logo.png" 
            alt="VibeClone Pro Logo" 
            fill 
            className="object-contain" 
            priority
          />
          {/* The Mix-Blend Overlay: Turns white pixels to exact cyan-400, leaves black alone */}
          <div className="absolute inset-0 bg-cyan-400 mix-blend-multiply pointer-events-none"></div>
        </div>
        <Link href="/" className="font-bold text-white text-xl tracking-tight">
          Vibe<span className="text-cyan-400">Clone</span>Pro
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {!userId ? (
          <Link href="/sign-in" className="bg-white text-black font-bold px-4 py-2 rounded text-sm hover:bg-gray-200 transition-colors">
            SIGN IN
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="text-gray-300 font-medium hover:text-white transition-colors mr-2">
              Dashboard
            </Link>
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-full border border-gray-700" } }} />
          </>
        )}
      </div>
    </nav>
  );
}
