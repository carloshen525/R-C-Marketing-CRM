'use client';

import React from 'react';
import { useCRM } from '@/lib/crm-context';
import { formatCurrencyBRL } from '@/lib/utils';
import {
  Users,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  Award,
  ArrowUpRight,
  Sparkles,
  Layers,
  BarChart2,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/icons';

export default function DashboardPage() {
  const { dashboardMetrics, leads } = useCRM();

  // Dynamic calculations based on active leads state
  const totalRevenue = leads.reduce((acc, l) => acc + (l.sale_status === 'paid' ? l.sale_amount : 0), 0);
  const totalWon = leads.filter((l) => l.sale_status === 'paid').length;
  const averageTicket = totalWon > 0 ? totalRevenue / totalWon : 0;
  const conversionRate = leads.length > 0 ? (totalWon / leads.length) * 100 : 0;
  const ctwaLeadsCount = leads.filter((l) => !l.is_organic).length;

  const statCards = [
    {
      label: 'Leads do Dia',
      value: dashboardMetrics.leadsToday.toString(),
      subtext: '+12% em relação a ontem',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Hoje',
    },
    {
      label: 'Leads do Mês',
      value: (dashboardMetrics.leadsMonth + leads.length - 6).toString(),
      subtext: `${ctwaLeadsCount} vindos do Meta Ads`,
      icon: Calendar,
      color: 'from-indigo-600 to-purple-600',
      badge: 'Novembro',
    },
    {
      label: 'Conversões (Vendas)',
      value: (dashboardMetrics.conversionsCount + (totalWon - 1)).toString(),
      subtext: 'Purchase enviado via CAPI',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Vendas',
    },
    {
      label: 'Faturamento Total',
      value: formatCurrencyBRL(dashboardMetrics.revenueTotal + (totalRevenue - 3500)),
      subtext: 'Originado via WhatsApp',
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      badge: 'Receita',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrencyBRL(totalWon > 0 ? averageTicket : dashboardMetrics.averageTicket),
      subtext: 'Por venda concluída',
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      badge: 'Médio',
    },
    {
      label: 'Taxa de Conversão',
      value: `${conversionRate.toFixed(1)}%`,
      subtext: 'Leads → Venda Concluída',
      icon: Percent,
      color: 'from-rose-500 to-pink-600',
      badge: 'Taxa',
    },
    {
      label: 'ROI Estimado',
      value: `${dashboardMetrics.estimatedROI}x`,
      subtext: 'Retorno sobre Ads Meta',
      icon: TrendingUp,
      color: 'from-violet-600 to-purple-700',
      badge: 'ROAS',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Dashboard de Performance
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Métricas em tempo real da jornada Meta Ads → WhatsApp → Venda Concluída → CAPI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Meta CAPI Conectada & Ativa
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {card.label}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {card.badge}
                </span>
              </div>
              <div className="my-3">
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  {card.subtext}
                </div>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div className={`h-full bg-gradient-to-r ${card.color} w-3/4 rounded-full`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads & Sales by Day Chart (SVG Bar Chart) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" />
                Leads e Vendas por Dia
              </h3>
              <p className="text-xs text-zinc-500">Comparativo dos últimos 7 dias de tráfego</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Leads
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Vendas
              </span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="h-64 flex items-end gap-6 pt-6 px-4 border-b border-zinc-200 dark:border-zinc-800">
            {dashboardMetrics.leadsByDay.map((d, index) => {
              const maxLeads = 40;
              const leadHeight = (d.leads / maxLeads) * 100;
              const saleHeight = (d.sales / maxLeads) * 100 * 3; // Scale sales for visual clarity
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Leads bar */}
                    <div
                      style={{ height: `${leadHeight}%` }}
                      className="w-1/2 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all relative group-hover:opacity-90"
                      title={`${d.leads} leads em ${d.date}`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.leads}
                      </span>
                    </div>
                    {/* Sales bar */}
                    <div
                      style={{ height: `${saleHeight}%` }}
                      className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group-hover:opacity-90"
                      title={`${d.sales} vendas em ${d.date}`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.sales}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 pt-2">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Day summary */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Faturamento Recente
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">R$ 101.2k / semana</span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">Receita gerada diretamente das conversões via WhatsApp</p>

            <div className="space-y-3">
              {dashboardMetrics.salesByDay.slice(-5).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">{s.date}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(s.revenue / 28000) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 min-w-[70px] text-right">
                      {formatCurrencyBRL(s.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-xs">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              Atribuição Meta 100% Precisa
            </span>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              Cada centavo rastreado está correlacionado com o click ID (ctwa_clid) do respectivo criativo e campanha na Meta.
            </p>
          </div>
        </div>
      </div>

      {/* Rankings Row: Top Campaigns & Top Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Campaigns */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Campanhas com Maior Faturamento
              </h3>
              <p className="text-xs text-zinc-500">Ranking por volume de receita gerada no CRM</p>
            </div>
          </div>

          <div className="space-y-4">
            {dashboardMetrics.topCampaigns.map((camp, idx) => (
              <div
                key={camp.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{camp.name}</h4>
                    <p className="text-[11px] text-zinc-500">
                      {camp.leads} leads • {camp.sales} vendas ({camp.conversionRate}% conv.)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    {formatCurrencyBRL(camp.revenue)}
                  </span>
                  <span className="text-[10px] text-zinc-400">Meta CAPI Ativo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Ads */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <InstagramIcon className="w-4 h-4 text-pink-500" />
                Anúncios (Criativos) Mais Lucrativos
              </h3>
              <p className="text-xs text-zinc-500">Qual criativo gerou mais compras no WhatsApp</p>
            </div>
          </div>

          <div className="space-y-4">
            {dashboardMetrics.topAds.map((ad, idx) => (
              <div
                key={ad.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{ad.name}</h4>
                    <p className="text-[11px] text-zinc-500">{ad.campaign} • {ad.sales} vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    {formatCurrencyBRL(ad.revenue)}
                  </span>
                  <span className="text-[10px] text-zinc-400">CTWA Click ID</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
