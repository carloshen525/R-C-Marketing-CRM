import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'R&C Marketing CRM - Meta Ads + WhatsApp + Conversions API',
  description:
    'SaaS Multi-tenant para rastreamento de anúncios Meta Ads Click-to-WhatsApp, CRM Kanban e disparo de conversões CAPI (LeadSubmitted & Purchase).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full antialiased overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
