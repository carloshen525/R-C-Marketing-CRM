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
  PlugZap,
  Globe,
  Lock,
  Building2,
  ShieldCheck,
  Sun,
  Moon,
  UserCheck,
  Users,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export function Sidebar() {
  const pathname = usePathname();
  const {
    activeCompany,
    currentUser,
    users,
    setCurrentUserRole,
  } = useCRM();

  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [showSessionSwitcher, setShowSessionSwitcher] = React.useState(false);

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

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  // Navigation Links for Client Panel (Strictly isolated)
  const clientNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'CRM Funil', href: '/crm', icon: KanbanSquare },
    { label: 'Conversas WhatsApp', href: '/whatsapp', icon: MessageSquare },
    { label: 'Status Integrações', href: '/integracoes', icon: PlugZap },
    { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  ];

  // Navigation Links for Master Panel (ONLY visible if super_admin)
  const masterNavItems = [
    { label: 'Visão Geral SaaS', href: '/admin', icon: LayoutDashboard },
    { label: 'Empresas & Clientes', href: '/master/empresas', icon: Building2 },
    { label: 'Instâncias WhatsApp', href: '/master/whatsapp', icon: MessageSquare },
    { label: 'Meta Ads & CAPI', href: '/master/meta-ads', icon: ShieldCheck },
  ];

  const currentNavItems = isSuperAdmin ? masterNavItems : clientNavItems;

  return (
    <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col h-screen border-r border-zinc-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-md ${
              isSuperAdmin
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 shadow-purple-600/30'
                : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-500 shadow-emerald-500/20'
            }`}
          >
            {isSuperAdmin ? 'M' : 'R'}
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              R&C Marketing{' '}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isSuperAdmin
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isSuperAdmin ? 'MASTER' : 'CRM'}
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 truncate max-w-[150px]">
              {isSuperAdmin ? 'Administrador Geral' : activeCompany.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tenant Subdomain / Context - Rendered for Clients */}
      {!isSuperAdmin && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              Ambiente da Empresa
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              Isolado
            </span>
          </div>
          <div className="font-mono text-[11px] font-bold text-zinc-100 truncate">
            {activeCompany.full_subdomain}
          </div>
        </div>
      )}

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 py-1">
          {isSuperAdmin ? 'Administração SaaS' : 'Menu Principal'}
        </div>

        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === '/admin' && pathname === '/master') ||
            (item.href === '/dashboard' && pathname === '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? isSuperAdmin
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

      {/* Footer: Theme, Session Switcher for Testing & Active User */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/70 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold px-1">
          <button
            onClick={() => setShowSessionSwitcher(!showSessionSwitcher)}
            className="text-[10px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 font-bold"
            title="Alternar usuário de teste para validação de segurança"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Trocar Usuário (Teste)
          </button>
          <button
            onClick={toggleTheme}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Alternar Tema Claro / Escuro"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Security Role Switcher Panel for Testing Isolation */}
        {showSessionSwitcher && (
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-[11px]">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
              Simular Acesso de Usuário:
            </span>

            {/* Master Super Admin */}
            <button
              onClick={() => {
                setCurrentUserRole('super_admin');
                setShowSessionSwitcher(false);
              }}
              className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between ${
                isSuperAdmin
                  ? 'bg-purple-900/50 text-purple-300 font-bold border border-purple-700/50'
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <span>Rodrigo (Master Admin)</span>
              <span className="text-[9px] bg-purple-950 px-1 py-0.2 rounded text-purple-400 font-mono">super_admin</span>
            </button>

            {/* Client Admin (Terra e Silva) */}
            <button
              onClick={() => {
                setCurrentUserRole('client_admin');
                setShowSessionSwitcher(false);
              }}
              className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between ${
                currentUser.role === 'client_admin'
                  ? 'bg-emerald-900/50 text-emerald-300 font-bold border border-emerald-700/50'
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <span>Helena (Terra e Silva)</span>
              <span className="text-[9px] bg-emerald-950 px-1 py-0.2 rounded text-emerald-400 font-mono">client_admin</span>
            </button>

            {/* Client User / Agent (Terra e Silva) */}
            <button
              onClick={() => {
                setCurrentUserRole('user');
                setShowSessionSwitcher(false);
              }}
              className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between ${
                currentUser.role === 'user'
                  ? 'bg-blue-900/50 text-blue-300 font-bold border border-blue-700/50'
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <span>Renata (Atendente)</span>
              <span className="text-[9px] bg-blue-950 px-1 py-0.2 rounded text-blue-400 font-mono">user</span>
            </button>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center gap-2.5 pt-1 px-1">
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
            alt={currentUser.full_name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700"
          />
          <div className="overflow-hidden leading-tight">
            <p className="text-xs font-bold text-zinc-200 truncate">{currentUser.full_name}</p>
            <p className="text-[10px] text-zinc-400">
              {isSuperAdmin
                ? 'Super Admin (R&C)'
                : currentUser.role === 'client_admin'
                ? 'Admin do Cliente'
                : 'Atendente'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
