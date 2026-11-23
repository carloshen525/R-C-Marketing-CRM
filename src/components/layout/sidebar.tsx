'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Settings,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeCompany,
    currentUser,
    users,
    environmentMode,
    setEnvironmentMode,
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

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';
  const isMasterView = isSuperAdmin && environmentMode === 'master';

  // Navigation Links for Client Panel (Strictly isolated)
  const clientNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'CRM Funil', href: '/crm', icon: KanbanSquare },
    { label: 'Status Integrações', href: '/integracoes', icon: PlugZap },
    { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  ];

  // Navigation Links for Master Panel (ONLY visible if super_admin in master mode)
  const masterNavItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Empresas', href: '/admin/empresas', icon: Building2 },
    { label: 'Usuários', href: '/admin/usuarios', icon: Users },
    { label: 'Instâncias WhatsApp', href: '/admin/whatsapp', icon: MessageSquare },
    { label: 'Integrações Meta', href: '/admin/meta-ads', icon: ShieldCheck },
    { label: 'Configurações SaaS', href: '/admin/configuracoes', icon: Settings },
  ];

  const currentNavItems = isMasterView ? masterNavItems : clientNavItems;

  return (
    <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col h-screen border-r border-zinc-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-md ${
              isMasterView
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 shadow-purple-600/30'
                : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-500 shadow-emerald-500/20'
            }`}
          >
            {isMasterView ? 'M' : 'R'}
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              R&C Marketing{' '}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isMasterView
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isMasterView ? 'MASTER' : 'CRM'}
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 truncate max-w-[150px]">
              {isMasterView ? 'Administrador Geral' : activeCompany.name}
            </p>
          </div>
        </div>
      </div>

      {/* Visão do Cliente Banner for Super Admin */}
      {isSuperAdmin && environmentMode === 'client' && (
        <div className="mx-3 mt-3 p-3 rounded-2xl bg-purple-950/70 border border-purple-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              Visão do Cliente
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200">
              Ativo
            </span>
          </div>
          <div className="font-bold text-white text-xs truncate">
            {activeCompany.name}
          </div>
          <button
            onClick={() => {
              setEnvironmentMode('master');
              router.push('/admin/empresas');
            }}
            className="w-full py-1.5 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Painel Master
          </button>
        </div>
      )}

      {/* Tenant Subdomain / Context - Rendered for Regular Clients */}
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
          {isMasterView ? 'Administração SaaS' : 'Menu Principal'}
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
                  ? isMasterView
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

        {isSuperAdmin && !isMasterView && (
          <div className="pt-2 mt-2 border-t border-zinc-800/60">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  document.cookie = 'rc_user_role=super_admin; path=/; max-age=86400; SameSite=Lax';
                }
                setEnvironmentMode('master');
                window.location.href = '/admin/empresas';
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 transition-all cursor-pointer shadow-sm"
            >
              <Lock className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Painel Master R&C</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer: Theme & Active User */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/70 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold px-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            {isSuperAdmin ? 'Master Admin' : 'Painel Cliente'}
          </span>
          <button
            onClick={toggleTheme}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Alternar Tema Claro / Escuro"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pt-1 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs ring-1 ring-zinc-700">
            {currentUser.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden leading-tight flex-1">
            <p className="text-xs font-bold text-zinc-200 truncate">{currentUser.full_name}</p>
            <p className="text-[10px] text-zinc-400">
              {isSuperAdmin
                ? 'Super Admin (R&C)'
                : currentUser.role === 'client_admin'
                ? 'Admin do Cliente'
                : 'Atendente'}
            </p>
          </div>
          <Link
            href="/login"
            className="text-[10px] text-zinc-400 hover:text-rose-400 font-semibold transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
            title="Sair da Plataforma"
          >
            Sair
          </Link>
        </div>
      </div>
    </aside>
  );
}
