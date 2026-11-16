'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { formatCurrencyBRL, formatPhone, formatRelativeTime } from '@/lib/utils';
import {
  X,
  Phone,
  Mail,
  User,
  Tag as TagIcon,
  MessageSquare,
  Sparkles,
  BarChart2,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  Layers,
  FileText,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/icons';

export function LeadDrawer() {
  const {
    selectedLead,
    setSelectedLead,
    stages,
    moveLeadStage,
    conversations,
    sendMessage,
    retryConversion,
    metaLogs,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'overview' | 'whatsapp' | 'meta' | 'notes'>('overview');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRetryingMeta, setIsRetryingMeta] = useState(false);

  if (!selectedLead) return null;

  const currentStage = stages.find((s) => s.id === selectedLead.stage_id);
  const chatMessages = conversations[selectedLead.id] || [];
  const leadMetaLogs = metaLogs.filter((l) => l.lead_id === selectedLead.id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    await sendMessage(selectedLead.id, inputText.trim());
    setInputText('');
    setIsSending(false);
  };

  const handleRetryMeta = async () => {
    setIsRetryingMeta(true);
    await retryConversion(selectedLead.id);
    setIsRetryingMeta(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-all duration-300">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-2 ring-emerald-500/20 shrink-0">
              {selectedLead.avatar_url ? (
                <img
                  src={selectedLead.avatar_url}
                  alt={selectedLead.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300">
                  {selectedLead.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{selectedLead.name}</h2>
                {selectedLead.is_organic ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    Orgânico
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      selectedLead.platform === 'instagram'
                        ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {selectedLead.platform === 'instagram' ? (
                      <InstagramIcon className="w-3 h-3" />
                    ) : (
                      <FacebookIcon className="w-3 h-3" />
                    )}
                    {selectedLead.platform === 'instagram' ? 'Instagram' : 'Facebook'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                <span>{formatPhone(selectedLead.phone)}</span>
                <span>•</span>
                <span>Criado {formatRelativeTime(selectedLead.created_at)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stage Selector */}
            <select
              value={selectedLead.stage_id}
              onChange={(e) => moveLeadStage(selectedLead.id, e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSelectedLead(null)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-6 gap-6 text-sm font-semibold bg-white dark:bg-zinc-900">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 relative ${
              activeTab === 'whatsapp'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {chatMessages.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('meta')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'meta'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Rastreamento Meta
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Notas & Tarefas
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sale Banner if Won */}
              {selectedLead.sale_status === 'paid' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Venda Concluída
                      </span>
                      <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                        {formatCurrencyBRL(selectedLead.sale_amount)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Produto: {selectedLead.product_name || 'Serviço'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-zinc-500">Conversão Meta CAPI</span>
                    <div className="mt-1">
                      {selectedLead.purchase_meta_status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Purchase Enviado
                        </span>
                      ) : selectedLead.purchase_meta_status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Falha no Envio
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">Não aplicável</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Telefone WhatsApp
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    {formatPhone(selectedLead.phone)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    E-mail
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    {selectedLead.email || 'Não informado'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Atendente Responsável
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <User className="w-4 h-4 text-blue-500" />
                    {selectedLead.assigned_agent?.full_name || 'Não atribuído'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Última Interação
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {formatRelativeTime(selectedLead.last_interaction_at)}
                  </div>
                </div>
              </div>

              {/* Meta Tracking Summary Card */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                    Rastreamento de Origem Meta
                  </h3>
                  {selectedLead.is_organic ? (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Lead orgânico - sem rastreamento Meta.
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Rastreado via CTWA
                    </span>
                  )}
                </div>

                {!selectedLead.is_organic && (
                  <div className="grid grid-cols-2 gap-y-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Campanha:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {selectedLead.campaign_name || 'Desconhecida'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Conjunto de Anúncios:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {selectedLead.adset_name || 'Desconhecido'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Anúncio Criativo:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {selectedLead.ad_name || 'Desconhecido'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Pixel ID:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {selectedLead.pixel_id || '891049281729381'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500 block">CTWA CLID (Meta Click ID):</span>
                      <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-800 dark:text-zinc-200 break-all select-all block mt-0.5">
                        {selectedLead.ctwa_clid || 'Nenhum'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                  Etiquetas / Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.tags && selectedLead.tags.length > 0 ? (
                    selectedLead.tags.map((t) => (
                      <span
                        key={t.id}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400">Nenhuma etiqueta atribuída</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Tab */}
          {activeTab === 'whatsapp' && (
            <div className="flex flex-col h-[520px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
              {/* WhatsApp Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    Nenhuma mensagem registrada nesta conversa.
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.is_from_me ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                          msg.is_from_me
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div
                          className={`text-[10px] mt-1 text-right ${
                            msg.is_from_me ? 'text-emerald-100' : 'text-zinc-400'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Digite uma mensagem WhatsApp..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Meta CAPI Details Tab */}
          {activeTab === 'meta' && (
            <div className="space-y-6">
              {/* Organic warning */}
              {selectedLead.is_organic ? (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Lead orgânico - sem rastreamento Meta.
                  </div>
                  <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                    Este contato não foi originado por anúncios Click-to-WhatsApp e não possui identificador <code className="font-mono text-xs">ctwa_clid</code>. Os eventos de conversão da Meta permanecem desabilitados para manter as métricas de ROAS precisas.
                  </p>
                </div>
              ) : (
                <>
                  {/* LeadSubmitted Event Card */}
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          Evento LeadSubmitted (CAPI)
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {selectedLead.lead_submitted_sent ? 'Enviado com Sucesso' : 'Pendente'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Disparado automaticamente na criação do lead via Click-to-WhatsApp. Bloqueado contra reenvios duplicados.
                    </p>
                    {selectedLead.lead_submitted_response_id && (
                      <div className="text-[11px] font-mono text-zinc-500">
                        Response ID: <span className="text-zinc-800 dark:text-zinc-200">{selectedLead.lead_submitted_response_id}</span>
                      </div>
                    )}
                  </div>

                  {/* Purchase Event Card */}
                  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          Evento Purchase (CAPI)
                        </h4>
                      </div>
                      <div>
                        {selectedLead.purchase_meta_status === 'sent' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Enviado com Sucesso
                          </span>
                        ) : selectedLead.purchase_meta_status === 'failed' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                            Erro no Envio
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            Aguardando Venda Concluída
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500">
                      Disparado exclusivamente quando o operador conclui a venda pelo CRM, reportando o valor em BRL ({formatCurrencyBRL(selectedLead.sale_amount)}).
                    </p>

                    {/* Error & Reenviar button */}
                    {selectedLead.purchase_meta_status === 'failed' && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold">Erro ao enviar conversão:</span>
                          <p>{selectedLead.purchase_meta_error || 'Meta CAPI rejeitou a chamada.'}</p>
                        </div>
                        <button
                          onClick={handleRetryMeta}
                          disabled={isRetryingMeta}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5 shrink-0"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRetryingMeta ? 'animate-spin' : ''}`} />
                          Reenviar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Audit Logs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Logs de Auditoria CAPI
                    </h5>
                    {leadMetaLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                          <span className="font-bold text-zinc-900 dark:text-zinc-200">{log.event_name}</span>
                          <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="text-zinc-500 text-[11px] truncate">
                          Trace ID: {log.response_fbtrace_id || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notes & Tasks Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">Observações Internas</h4>
                <textarea
                  rows={4}
                  placeholder="Adicione anotações sobre negociações, objeções ou preferências do cliente..."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  defaultValue="Cliente demonstrou forte interesse na mentoria. Precisa de alinhamento com sócio antes do fechamento."
                />
                <div className="mt-2 text-right">
                  <button className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold">
                    Salvar Nota
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
