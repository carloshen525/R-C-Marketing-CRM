'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { formatCurrencyBRL } from '@/lib/utils';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Wifi,
  Sparkles,
  ArrowUpRight,
  Plus,
  ExternalLink,
  Lock,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function MasterDashboardPage() {
  const router = useRouter();
  const { masterMetrics, companies, metaLogs, currentUser } = useCRM();

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/acesso-negado');
    }
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) {
    return null;
  }

  const kpis = [
    {
      label: 'MRR do SaaS (Mensal)',
      value: formatCurrencyBRL(masterMetrics.mrrTotal),
      subtext: '+18.4% este mês',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Empresas Ativas',
      value: `${masterMetrics.activeCompanies} / ${companies.length}`,
      subtext: `${masterMetrics.suspendedCompanies} contas suspensas`,
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      label: 'Instâncias WhatsApp (Evo)',
      value: `${masterMetrics.evolutionInstancesOnline} / ${masterMetrics.evolutionInstancesTotal}`,
      subtext: '100% instâncias isoladas',
      icon: Wifi,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Eventos CAPI Despachados',
      value: masterMetrics.totalCapiEventsSent.toLocaleString('pt-BR'),
      subtext: 'LeadSubmitted & Purchase',
      icon: ShieldCheck,
      color: 'from-purple-600 to-indigo-700',
    },
    {
      label: 'Leads Rastreados (SaaS)',
      value: masterMetrics.totalLeadsTracked.toLocaleString('pt-BR'),
      subtext: 'Via Meta Ads CTWA',
      icon: Users,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Faturamento Total dos Clientes',
      value: formatCurrencyBRL(masterMetrics.totalRevenueGenerated),
      subtext: 'Originado via WhatsApp',
      icon: TrendingUp,
      color: 'from-rose-500 to-pink-600',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Master Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 border border-zinc-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Painel Master R&C Marketing
            </span>
            <span className="text-xs text-zinc-400 font-mono">v2.4 Pro Multi-Tenant</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Controle Geral de Clientes & Infraestrutura SaaS
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Ambiente exclusivo dos administradores da agência. Gerencie empresas contratantes, subdomínios, credenciais Meta Ads CAPI e instâncias dedicadas da Evolution API.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            href="/master/empresas"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa / Cliente
          </Link>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 via-blue-500/5 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k, idx) => {
          const Icon = k.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {k.label}
                </span>
                <div className={`p-2 rounded-xl bg-gradient-to-r ${k.color} text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {k.value}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  {k.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Recent Tenants & Real-Time CAPI Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies Summary */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Empresas Contratantes
              </h3>
              <p className="text-xs text-zinc-500">Clientes hospedados com subdomínios próprios</p>
            </div>
            <Link
              href="/master/empresas"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Ver Todas ({companies.length})
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {companies.map((c) => (
              <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm text-zinc-700 dark:text-zinc-300">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{c.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                        {c.full_subdomain}
                      </span>
                      <span className="text-[10px] text-zinc-400">• {c.owner_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      Plano {c.plan}
                    </span>
                    <span
                      className={`block text-[10px] font-semibold mt-1 ${
                        c.status === 'active' ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    >
                      {c.status === 'active' ? '🟢 Ativa' : '🟡 Suspensa'}
                    </span>
                  </div>

                  <Link
                    href={`/master/empresas`}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold"
                    title="Editar configurações técnicas"
                  >
                    Gerenciar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global CAPI Events Dispatch Stream */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Feed de Eventos Meta CAPI
                </h3>
                <p className="text-xs text-zinc-500">Disparos em tempo real das empresas</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3">
              {metaLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-purple-600 dark:text-purple-400">{log.event_name}</span>
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sucesso (200)
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    Trace ID: {log.response_fbtrace_id}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Origem: Click-to-WhatsApp (Chat)
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300">
            <strong>Deduplicação Ativa:</strong> Todos os eventos utilizam <code>event_id</code> idempotente e hashes SHA-256 de dados pessoais.
          </div>
        </div>
      </div>
    </div>
  );
}
