'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { formatCurrencyBRL, formatPhone } from '@/lib/utils';
import {
  Download,
  Filter,
  BarChart3,
  DollarSign,
  Users,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Search,
  Sparkles,
  User,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/icons';

export default function RelatoriosPage() {
  const { leads, dashboardMetrics, activeCompany, stages, users } = useCRM();

  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'leads' | 'campanhas' | 'anuncios' | 'funcionarios'>('leads');

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesCamp = filterCampaign === 'all' || l.campaign_name === filterCampaign;
    const matchesAgent = filterAgent === 'all' || l.assigned_to === filterAgent;
    const matchesStatus = filterStatus === 'all' || l.sale_status === filterStatus;
    return matchesCamp && matchesAgent && matchesStatus;
  });

  const totalRevenue = filteredLeads.reduce((acc, l) => acc + (l.sale_status === 'paid' ? l.sale_amount : 0), 0);
  const totalWon = filteredLeads.filter((l) => l.sale_status === 'paid').length;
  const averageTicket = totalWon > 0 ? totalRevenue / totalWon : 0;
  const conversionRate = filteredLeads.length > 0 ? (totalWon / filteredLeads.length) * 100 : 0;

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nome',
      'Telefone',
      'Origem',
      'Campanha',
      'Conjunto',
      'Anuncio',
      'CTWA_CLID',
      'Pixel_ID',
      'Status_Venda',
      'Valor_BRL',
      'LeadSubmitted_Enviado',
      'Purchase_Enviado',
      'Responsavel',
      'Data_Criacao',
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name}"`,
      `"${l.phone}"`,
      l.is_organic ? 'Organico' : l.platform || 'Meta Ads',
      `"${l.campaign_name || 'N/A'}"`,
      `"${l.adset_name || 'N/A'}"`,
      `"${l.ad_name || 'N/A'}"`,
      `"${l.ctwa_clid || 'N/A'}"`,
      `"${l.pixel_id || 'N/A'}"`,
      l.sale_status,
      l.sale_amount,
      l.lead_submitted_sent ? 'SIM' : 'NAO',
      l.purchase_sent ? 'SIM' : 'NAO',
      `"${l.assigned_agent?.full_name || 'N/A'}"`,
      l.created_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_rc_marketing_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const campaignsList = Array.from(new Set(leads.map((l) => l.campaign_name).filter(Boolean))) as string[];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Relatórios e Atribuição Meta Ads
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Empresa: {activeCompany.name} • Dados agregados de conversão e faturamento via WhatsApp
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Exportar CSV Completo
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Leads Filtrados</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 my-2">
            {filteredLeads.length}
          </div>
          <span className="text-xs text-zinc-500">Total no período</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Conversões (Vendas)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 my-2">
            {totalWon}
          </div>
          <span className="text-xs text-zinc-500">Taxa: {conversionRate.toFixed(1)}%</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Faturamento</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 my-2">
            {formatCurrencyBRL(totalRevenue)}
          </div>
          <span className="text-xs text-zinc-500">Receita confirmada</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ticket Médio</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 my-2">
            {formatCurrencyBRL(averageTicket)}
          </div>
          <span className="text-xs text-zinc-500">Por lead convertido</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-wrap items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2 text-zinc-500 font-bold">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filtros:
        </div>

        {/* Campaign Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">Campanha:</span>
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
          >
            <option value="all">Todas as Campanhas</option>
            {campaignsList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">Responsável:</span>
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
          >
            <option value="all">Todos os Atendentes</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">Status Venda:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pago (Venda Concluída)</option>
            <option value="pending">Pendente</option>
            <option value="none">Sem Venda</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 text-sm font-bold">
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'leads'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Leads & Rastreamento
        </button>
        <button
          onClick={() => setActiveTab('campanhas')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'campanhas'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Campanhas Meta
        </button>
        <button
          onClick={() => setActiveTab('anuncios')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'anuncios'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Criativos (Anúncios)
        </button>
        <button
          onClick={() => setActiveTab('funcionarios')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'funcionarios'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Funcionários / Atendentes
        </button>
      </div>

      {/* Tab 1: Leads Detailed Table */}
      {activeTab === 'leads' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Origem / Canal</th>
                  <th className="px-5 py-3.5">Campanha & Anúncio</th>
                  <th className="px-5 py-3.5">CTWA CLID</th>
                  <th className="px-5 py-3.5">Responsável</th>
                  <th className="px-5 py-3.5">Valor Venda</th>
                  <th className="px-5 py-3.5">Meta CAPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{lead.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">{formatPhone(lead.phone)}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.is_organic ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                          Orgânico
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 w-fit">
                          {lead.platform === 'facebook' ? <FacebookIcon className="w-3 h-3" /> : <InstagramIcon className="w-3 h-3" />}
                          CTWA
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {lead.campaign_name || '—'}
                      </div>
                      <div className="text-[11px] text-zinc-500">{lead.ad_name || '—'}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500 max-w-[150px] truncate">
                      {lead.ctwa_clid || 'N/A (Orgânico)'}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                      {lead.assigned_agent?.full_name || 'Não atribuído'}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {lead.sale_amount > 0 ? formatCurrencyBRL(lead.sale_amount) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.purchase_sent ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          Purchase OK
                        </span>
                      ) : lead.lead_submitted_sent ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                          LeadSub OK
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Campaigns */}
      {activeTab === 'campanhas' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Campanha</th>
                <th className="px-5 py-3.5">Total de Leads</th>
                <th className="px-5 py-3.5">Vendas Concluídas</th>
                <th className="px-5 py-3.5">Taxa de Conversão</th>
                <th className="px-5 py-3.5">Faturamento Gerado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {dashboardMetrics.topCampaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                  <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                    🎯 {camp.name}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-zinc-700 dark:text-zinc-300">
                    {camp.leads}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-600">
                    {camp.sales}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-zinc-700 dark:text-zinc-300">
                    {camp.conversionRate}%
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(camp.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Ads */}
      {activeTab === 'anuncios' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Criativo / Anúncio</th>
                <th className="px-5 py-3.5">Campanha</th>
                <th className="px-5 py-3.5">Vendas Geradas</th>
                <th className="px-5 py-3.5">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {dashboardMetrics.topAds.map((ad) => (
                <tr key={ad.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                  <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                    📢 {ad.name}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {ad.campaign}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-600">
                    {ad.sales} vendas
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(ad.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Team / Staff */}
      {activeTab === 'funcionarios' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Funcionário</th>
                <th className="px-5 py-3.5">Perfil</th>
                <th className="px-5 py-3.5">Leads Atendidos</th>
                <th className="px-5 py-3.5">Vendas Fechadas</th>
                <th className="px-5 py-3.5">Faturamento Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => {
                const userLeads = leads.filter((l) => l.assigned_to === u.id);
                const userWon = userLeads.filter((l) => l.sale_status === 'paid');
                const userRev = userWon.reduce((acc, l) => acc + l.sale_amount, 0);

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                        alt={u.full_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      {u.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 capitalize">
                      {u.role}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-700 dark:text-zinc-300">
                      {userLeads.length} leads
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-600">
                      {userWon.length}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyBRL(userRev)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
