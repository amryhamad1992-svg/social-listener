'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Settings,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
  { name: 'Mentions', href: '/mentions', icon: Search },
];

interface SidebarProps {
  brandName?: string;
  onLogout?: () => void;
}

export function Sidebar({ brandName = 'Revlon', onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-64 bg-primary text-white">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">SL</span>
          </div>
          <span className="font-semibold text-lg">Social Listener</span>
        </div>
      </div>

      {/* Brand Selector */}
      <div className="px-4 py-4 border-b border-white/10">
        <p className="text-xs text-white/60 uppercase tracking-wide mb-2">
          Monitoring
        </p>
        <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
            <span className="font-semibold text-sm">
              {brandName.charAt(0)}
            </span>
          </div>
          <span className="font-medium">{brandName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
