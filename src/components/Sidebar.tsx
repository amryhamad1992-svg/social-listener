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
} from 'lucide-react';
import { useSettings } from '@/lib/useSettings';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
  { name: 'Mentions', href: '/mentions', icon: Search },
];

interface SidebarProps {
  onLogout?: () => void;
}

const BRANDS = [
  { id: 'revlon', name: 'Revlon', emoji: '💄' },
  { id: 'elf', name: 'e.l.f.', emoji: '✨' },
  { id: 'maybelline', name: 'Maybelline', emoji: '💋' },
];

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { settings, saveSettings } = useSettings();

  // Get brand emoji based on selected brand
  const currentBrand = BRANDS.find(b => b.id === settings.selectedBrand) || BRANDS[0];

  const handleBrandChange = (brandId: string) => {
    saveSettings({ selectedBrand: brandId });
  };

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

      {/* Brand Selector */}
      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 p-2">
          <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">{currentBrand.emoji}</span>
          </div>
          <div className="flex-1">
            <select
              value={settings.selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-white border-none focus:outline-none cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', paddingRight: '16px' }}
            >
              {BRANDS.map((brand) => (
                <option key={brand.id} value={brand.id} className="bg-[#0F172A] text-white">
                  {brand.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-white/50 block">Selected Brand</span>
          </div>
        </div>
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
