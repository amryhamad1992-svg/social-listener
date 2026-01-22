'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search,
  LogOut,
  Radar,
  Users,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { name: 'Trend Radar', href: '/trend-radar', icon: Radar },
  { name: 'Mentions', href: '/mentions', icon: Search },
  { name: 'Audience Builder', href: '/audience-builder', icon: Users },
  { name: 'Audience Builder 2.0', href: '/audience-builder-2', icon: Sparkles },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-56 bg-[#031425] text-white">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-white/10">
        <Image
          src="/logo.svg"
          alt="Stackline"
          width={120}
          height={21}
          className="brightness-0 invert"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-[13px] transition-colors relative ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#16949b] rounded-r" />
              )}
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-[13px] text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
