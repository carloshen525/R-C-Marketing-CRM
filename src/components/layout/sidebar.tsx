'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import {
  LayoutDashboard,
  KanbanSquare,
  MessageSquare,
  BarChart3,
  Settings,
  ShieldCheck,
  Wifi,
  Sun,
  Moon,
  Building2,
  ChevronRight,
  Lock,
  Layers,
  PlugZap,
  Globe,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export function Sidebar() {
  const pathname = usePathname();
  const {
    environmentMode,
    setEnvironmentMode,
    companies,
    activeCompany,
    setActiveCompanyId,
    currentUser,
    setCurrentUserRole,
    clientIntegrationStatus,
  } = useCRM();

  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (root.classList.contains('dark')) {
        root.classList.remove('dark');
        setIsDarkMode(false);
      } else {
        root.classList.add('dark');
        setIsDarkMode(true);
      }
    }
  };

  // Navigation Links for Client Panel
  const clientNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'CRM Funil', href: '/crm', icon: KanbanSquare },
    { label: 'Conversas WhatsApp', href: '/whatsapp', icon: MessageSquare },
    { label: 'Status Integrações', href: '/integracoes', icon: PlugZap },
    { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  ];

  // Navigation Links for Master Panel (R&C Internal)
  const masterNavItems = [
    { label: 'Visão Geral SaaS', href: '/master', icon: LayoutDashboard },
    { label: 'Empresas & Clientes', href: '/master/empresas', icon: Building2 },
    { label: 'Instâncias WhatsApp', href: '/master/whatsapp', icon: MessageSquare },
    { label: 'Meta Ads & CAPI', href: '/master/meta-ads', icon: ShieldCheck },
  ];

  const currentNavItems = environmentMode === 'master' ? masterNavItems : clientNavItems;

  return (
    <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col h-screen border-r border-zinc-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-md ${
              environmentMode === 'master'
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 shadow-purple-600/30'
                : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-500 shadow-emerald-500/20'
            }`}
          >
            {environmentMode === 'master' ? 'M' : 'R'}
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              R&C Marketing{' '}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  environmentMode === 'master'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {environmentMode === 'master' ? 'MASTER' : 'CLIENTE'}
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 truncate max-w-[150px]">
              {environmentMode === 'master' ? 'Administrador Geral' : activeCompany.name}
            </p>
          </div>
        </div>

        {/* Environment Switcher Pill */}
        <div className="mt-3 p-1 bg-zinc-950 rounded-xl border border-zinc-800 flex text-center text-[10px] font-bold">
          <button
            onClick={() => setEnvironmentMode('client')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              environmentMode === 'client'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Painel Cliente
          </button>
          <button
            onClick={() => setEnvironmentMode('master')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              environmentMode === 'master'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Lock className="w-2.5 h-2.5" />
            Painel Master
          </button>
        </div>
      </div>

      {/* Tenant Subdomain / Context (Client Mode) */}
      {environmentMode === 'client' && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              Subdomínio Ativo
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              Isolado
            </span>
          </div>

          <div className="font-mono text-[11px] font-bold text-zinc-100 truncate">
            {activeCompany.full_subdomain}
          </div>

          {/* Company Switcher for Testing Multi-Tenancy */}
          <div className="pt-1">
            <select
              value={activeCompany.id}
              onChange={(e) => setActiveCompanyId(e.target.value)}
              className="w-full text-[11px] font-semibold px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subdomain})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 py-1">
          {environmentMode === 'master' ? 'Administração SaaS' : 'Menu da Empresa'}
        </div>

        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? environmentMode === 'master'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: Theme & Active User info */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/70 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold px-1">
          <span className="flex items-center gap-1">
            {environmentMode === 'master' ? (
              <span className="text-purple-400 font-bold">R&C Equipe Master</span>
            ) : (
              <span className="text-emerald-400 font-bold">Acesso Cliente</span>
            )}
          </span>
          <button
            onClick={toggleTheme}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Alternar Tema Claro / Escuro"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pt-1 px-1">
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
            alt={currentUser.full_name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700"
          />
          <div className="overflow-hidden leading-tight">
            <p className="text-xs font-bold text-zinc-200 truncate">{currentUser.full_name}</p>
            <p className="text-[10px] text-zinc-400 capitalize">
              {currentUser.role === 'master_admin' ? 'Master Admin' : currentUser.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
