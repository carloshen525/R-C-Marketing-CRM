'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { Lead, PipelineStage } from '@/lib/types';
import { formatCurrencyBRL, formatPhone, formatRelativeTime } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  MoveRight,
  RefreshCw,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/icons';
import { LeadDrawer } from '@/components/crm/lead-drawer';
import { SaleModal } from '@/components/crm/sale-modal';
import { NewLeadModal } from '@/components/crm/new-lead-modal';

export default function CRMKanbanPage() {
  const {
    stages,
    leads,
    moveLeadStage,
    setSelectedLead,
    addStage,
    syncWhatsAppLeads,
    isSyncingLeads,
    updateLead,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterOrigin, setFilterOrigin] = useState<'all' | 'meta' | 'organic'>('all');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366F1');

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.campaign_name && lead.campaign_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.ad_name && lead.ad_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCampaign =
      filterCampaign === 'all' || lead.campaign_name === filterCampaign;

    const matchesOrigin =
      filterOrigin === 'all' ||
      (filterOrigin === 'meta' && !lead.is_organic) ||
      (filterOrigin === 'organic' && lead.is_organic);

    return matchesSearch && matchesCampaign && matchesOrigin;
  });

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    setDragOverStageId(null);
    setDraggedLeadId(null);

    if (leadId) {
      moveLeadStage(leadId, targetStageId);
    }
  };

  const handleAddStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    addStage(newStageName.trim(), newStageColor);
    setNewStageName('');
    setIsAddingStage(false);
  };

  const allCampaigns = Array.from(
    new Set(leads.map((l) => l.campaign_name).filter(Boolean))
  ) as string[];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-100/70 dark:bg-zinc-950">
      {/* Top Filter Bar */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Funil Comercial
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {leads.length} {leads.length === 1 ? 'Lead' : 'Leads'}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no Kanban..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Campaign Filter */}
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">Todas as Campanhas</option>
            {allCampaigns.map((camp) => (
              <option key={camp} value={camp}>
                {camp}
              </option>
            ))}
          </select>

          {/* Origin Filter */}
          <select
            value={filterOrigin}
            onChange={(e) => setFilterOrigin(e.target.value as any)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">Todas as Origens</option>
            <option value="meta">Meta Ads (CTWA)</option>
            <option value="organic">Orgânico</option>
          </select>

          {/* Sync WhatsApp button */}
          <button
            onClick={() => syncWhatsAppLeads()}
            disabled={isSyncingLeads}
            title="Sincronizar mensagens e leads do WhatsApp"
            className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLeads ? 'animate-spin' : ''}`} />
            <span>{isSyncingLeads ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* Add New Stage button */}
          <button
            onClick={() => setIsAddingStage(true)}
            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Etapa
          </button>

          {/* Add Lead button */}
          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Lead
          </button>
        </div>
      </div>

      {/* Add Stage Inline Modal */}
      {isAddingStage && (
        <div className="bg-emerald-50 dark:bg-zinc-900 border-b border-emerald-200 dark:border-zinc-800 p-4 flex items-center justify-between">
          <form onSubmit={handleAddStageSubmit} className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nova Etapa do Funil:</span>
            <input
              type="text"
              required
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Ex: Proposta Enviada, Reunião Agendada..."
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
            <input
              type="color"
              value={newStageColor}
              onChange={(e) => setNewStageColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-300 p-0.5"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
            >
              Criar Etapa
            </button>
            <button
              type="button"
              onClick={() => setIsAddingStage(false)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 text-xs text-zinc-600 font-medium"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Kanban Board Container (Horizontally Scrollable) */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-5 items-start">
        {stages.map((stage, sIdx) => {
          const stageLeads = filteredLeads.filter((l) => {
            if (l.stage_id === stage.id) return true;
            if (sIdx === 0 && (!l.stage_id || l.stage_id === 'stage_new' || !stages.some((s) => s.id === l.stage_id))) {
              return true;
            }
            return false;
          });
          const stageTotalRevenue = stageLeads.reduce((acc, l) => acc + (l.sale_amount || 0), 0);
          const isOver = dragOverStageId === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-80 shrink-0 flex flex-col max-h-full rounded-2xl border transition-all ${
                isOver
                  ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30'
                  : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {stage.name}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {stageLeads.length}
                  </span>
                </div>

                {stage.is_won && (
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Ganho
                  </span>
                )}
              </div>

              {/* Revenue Subheader if any */}
              {stageTotalRevenue > 0 && (
                <div className="px-3.5 py-1.5 bg-zinc-100/50 dark:bg-zinc-800/40 border-b border-zinc-200/60 dark:border-zinc-800/60 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>Total na Etapa:</span>
                  <span>{formatCurrencyBRL(stageTotalRevenue)}</span>
                </div>
              )}

              {/* Cards List (Draggable) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px]">
                {stageLeads.map((lead) => {
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-emerald-500/50 cursor-pointer transition-all space-y-3 group"
                    >
                      {/* Top: Avatar, Name & Phone */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700">
                            {lead.avatar_url ? (
                              <img
                                src={lead.avatar_url}
                                alt={lead.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                {lead.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                              {lead.name}
                            </h4>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              {formatPhone(lead.phone)}
                            </p>
                          </div>
                        </div>

                        {/* Origin Badge */}
                        <div>
                          {lead.is_organic ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLead(lead.id, {
                                  is_organic: false,
                                  platform: 'instagram',
                                  campaign_name: lead.campaign_name || '[Eng] [Jogo da Memória das Silabas] [10.11]',
                                  ad_name: lead.ad_name || '01 - Jogo da Memória das Sílabas',
                                });
                              }}
                              title="Clique para vincular este lead ao Instagram Ads"
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-pink-100 dark:hover:bg-pink-950/60 hover:text-pink-600 transition-all cursor-pointer flex items-center gap-1"
                            >
                              Orgânico
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (lead.platform === 'instagram') {
                                  updateLead(lead.id, { platform: 'facebook' });
                                } else {
                                  updateLead(lead.id, { is_organic: true, platform: 'organic' });
                                }
                              }}
                              title="Clique para alternar entre Instagram, Facebook e Orgânico"
                              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border transition-all hover:scale-105 cursor-pointer ${
                                lead.platform === 'instagram'
                                  ? 'bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200/50'
                                  : 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/40'
                              }`}
                            >
                              {lead.platform === 'instagram' ? (
                                <InstagramIcon className="w-2.5 h-2.5" />
                              ) : (
                                <FacebookIcon className="w-2.5 h-2.5" />
                              )}
                              {lead.platform === 'instagram' ? 'Instagram' : 'Facebook'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Campaign & Ad Details */}
                      {!lead.is_organic && lead.campaign_name && (
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-[11px] space-y-0.5 border border-zinc-100 dark:border-zinc-800">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            🎯 {lead.campaign_name}
                          </div>
                          <div className="text-zinc-500 truncate text-[10px]">
                            📢 {lead.ad_name || 'Anúncio Padrão'}
                          </div>
                        </div>
                      )}

                      {/* Sale amount if registered */}
                      {lead.sale_amount > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 text-[11px]">Valor:</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrencyBRL(lead.sale_amount)}
                          </span>
                        </div>
                      )}

                      {/* Meta Conversions Status indicator */}
                      {!lead.is_organic && (
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            LeadSubmitted
                          </span>
                          {lead.purchase_sent ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Purchase CAPI
                            </span>
                          ) : lead.purchase_meta_status === 'failed' ? (
                            <span className="font-bold text-red-500 flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" />
                              Erro CAPI
                            </span>
                          ) : (
                            <span>CTWA Ativo</span>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                              style={{ backgroundColor: t.color }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Responsible Agent & Last interaction */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="flex items-center gap-1 truncate max-w-[130px]">
                          <User className="w-3 h-3 text-zinc-400" />
                          {lead.assigned_agent?.full_name?.split(' ')[0] || 'Atendente'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(lead.last_interaction_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {stageLeads.length === 0 && (
                  <div className="h-28 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 text-xs">
                    Arraste leads para esta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sale Modal and Lead Details Drawer */}
      <SaleModal />
      <LeadDrawer />
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
      />
    </div>
  );
}
