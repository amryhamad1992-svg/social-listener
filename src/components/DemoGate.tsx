'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Change this password to whatever you want
const DEMO_PASSWORD = 'STACKLINE2025';
const STORAGE_KEY = 'demo-access-granted';

interface DemoGateProps {
  children: React.ReactNode;
}

export function DemoGate({ children }: DemoGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a brief delay for UX
    setTimeout(() => {
      if (password === DEMO_PASSWORD) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setHasAccess(true);
      } else {
        setError('Invalid access code. Please try again.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  // Loading state while checking auth
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show password gate
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.svg"
                alt="Stackline"
                width={180}
                height={32}
                priority
              />
            </div>
            <p className="text-[13px] text-[#64748B] mt-1">
              Enter your access code to continue
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-center w-10 h-10 bg-[#0EA5E9]/10 rounded-lg mx-auto mb-4">
              <Lock className="w-5 h-5 text-[#0EA5E9]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.toUpperCase())}
                    placeholder="Enter access code"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent text-center tracking-widest font-mono text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-[12px] text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!password || isLoading}
                className="w-full py-2.5 bg-[#0EA5E9] text-white rounded-lg text-[13px] font-medium hover:bg-[#0284C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Access Demo'
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-[#94A3B8] mt-4">
              This demo contains confidential data. Unauthorized access is prohibited.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[#94A3B8] text-[11px] mt-5">
            A Stackline Product
          </p>
        </div>
      </div>
    );
  }

  // User has access - render the app
  return <>{children}</>;
}
