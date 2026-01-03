'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
  { name: 'Mentions', href: '/mentions', icon: Search },
];

interface SidebarProps {
  categoryName?: string;
  onLogout?: () => void;
}

export function Sidebar({ categoryName = 'Beauty', onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-56 bg-[#0F172A] text-white">
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

      {/* Category Selector */}
      <div className="px-3 py-3 border-b border-white/10">
        <button className="w-full flex items-center justify-between gap-2 p-2 hover:bg-white/5 rounded transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center">
              <span className="text-sm">💄</span>
            </div>
            <div className="text-left">
              <span className="text-sm font-medium block">{categoryName}</span>
              <span className="text-[10px] text-white/50">Category</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-white/50" />
        </button>
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
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0EA5E9] rounded-r" />
              )}
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/10">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded text-[13px] transition-colors relative ${
            pathname === '/settings'
              ? 'bg-white/10 text-white font-medium'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          {pathname === '/settings' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0EA5E9] rounded-r" />
          )}
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
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
