'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function ClienteIntegracoesPage() {
  const { activeCompany, clientIntegrationStatus, updateWhatsAppStatus } = useCRM();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [supportRequested, setSupportRequested] = useState(false);

  const handleReconnect = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      updateWhatsAppStatus('connected');
      setIsRefreshing(false);
    }, 1200);
  };

  const handleOpenQr = () => {
    setShowQrModal(true);
  };

  const handleRequestSupport = () => {
    setSupportRequested(true);
    setTimeout(() => setSupportRequested(false), 3500);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Painel do Cliente • {activeCompany.name}
          </span>
        </div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Status das Integrações
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Acompanhe o status da conexão do seu WhatsApp e do rastreamento de anúncios e conversões da Meta.
        </p>
      </div>

      {supportRequested && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Solicitação de suporte enviada para a equipe R&C Marketing! Entraremos em contato via WhatsApp.</span>
        </div>
      )}

      {/* Grid: 2 Cards (WhatsApp + Meta Ads) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: WhatsApp Status */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {clientIntegrationStatus.whatsapp.statusText}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {clientIntegrationStatus.whatsapp.isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {clientIntegrationStatus.whatsapp.isConnected
                  ? 'Comunicação ativa para atendimento e vendas.'
                  : 'Nenhum aparelho conectado no momento.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Status da Sessão:</span>
                <span className={`font-bold ${clientIntegrationStatus.whatsapp.isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                  {clientIntegrationStatus.whatsapp.isConnected ? '🟢 Online' : '🔴 Desconectado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Última sincronização:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {clientIntegrationStatus.whatsapp.lastSyncAt}
                </span>
              </div>
            </div>
          </div>

          {/* Client WhatsApp Actions */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={handleReconnect}
              disabled={isRefreshing}
              className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Reconectar WhatsApp
            </button>

            <button
              onClick={handleOpenQr}
              className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <QrCode className="w-3.5 h-3.5" />
              Atualizar QR Code
            </button>

            <button
              onClick={handleRequestSupport}
              className="w-full py-2 text-center text-xs font-semibold text-zinc-500 hover:text-emerald-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Solicitar suporte
            </button>
          </div>
        </div>

        {/* Card 2: Meta Ads Status */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {clientIntegrationStatus.metaAds.statusText}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Meta Ads
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {clientIntegrationStatus.metaAds.isConnected
                  ? 'Rastreamento automático de conversões CAPI ativo.'
                  : 'Nenhum Pixel ou Token CAPI configurado.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Rastreamento Meta:</span>
                <span className={`font-bold ${clientIntegrationStatus.metaAds.isConnected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`}>
                  {clientIntegrationStatus.metaAds.isConnected ? '🟢 Ativo e Monitorado' : '🔴 Inativo / Não Configurado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Última conversão enviada:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {clientIntegrationStatus.metaAds.lastConversionSentAt}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Leads rastreados:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {clientIntegrationStatus.metaAds.leadsTrackedCount} leads
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Compras (Purchase) enviadas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {clientIntegrationStatus.metaAds.purchasesSentCount} vendas
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 text-xs space-y-1">
            <span className="font-bold text-blue-700 dark:text-blue-300 block">
              Gerenciado pela R&C Marketing
            </span>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Toda a infraestrutura de pixel, tokens seguros e deduplicação de eventos é gerenciada pela equipe técnica. Você só precisa atender e vender!
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal for Client */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Conectar WhatsApp no Painel
            </h3>
            <p className="text-xs text-zinc-500">
              Abra o WhatsApp → Aparelhos Conectados → Conectar um Aparelho.
            </p>

            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-emerald-500 inline-block shadow-md">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=EvolutionAPI_Instance_Client_Pairing_Token"
                alt="QR Code WhatsApp"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  updateWhatsAppStatus('connected');
                  setShowQrModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Confirmar Leitura do QR
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
