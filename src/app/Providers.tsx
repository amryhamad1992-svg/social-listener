'use client';

import { SettingsProvider } from '@/lib/SettingsContext';
import { DemoGate } from '@/components/DemoGate';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DemoGate>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </DemoGate>
  );
}
