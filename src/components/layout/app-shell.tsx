'use client';

import React from 'react';
import { CRMProvider } from '@/lib/crm-context';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-100/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </CRMProvider>
  );
}
