'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SmartNavbar() {
  const pathname = usePathname();
  
  // LOGIC: If we are on the Dashboard or Editor, hide this global header
  // so the app's own interface can take over.
  if (pathname.includes('/dashboard') || pathname.includes('/editor')) {
    return null;
  }

  return (
    <nav className="border-b border-gray-800 bg-[#0A0F14] p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center font-bold text-black">V</div>
        <Link href="/" className="font-bold text-white text-xl tracking-tight">VibeClonePro</Link>
      </div>
      <Link href="/pricing" className="bg-white text-black font-bold px-4 py-2 rounded text-sm hover:bg-gray-200 transition-colors">
        GET ACCESS
      </Link>
    </nav>
  );
}
