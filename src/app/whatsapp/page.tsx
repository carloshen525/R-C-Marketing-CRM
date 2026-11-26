'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { formatPhone, formatRelativeTime } from '@/lib/utils';
import {
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Power,
  MessageSquare,
  Send,
  Phone,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/icons';

export default function WhatsAppPage() {
  const {
    activeCompany,
    whatsappInstance,
    updateWhatsAppStatus,
    leads,
    conversations,
    sendMessage,
    selectedLead,
    setSelectedLead,
  } = useCRM();

  const [activeChatLeadId, setActiveChatLeadId] = useState<string>(leads[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const effectiveInstanceName =
    (whatsappInstance.instance_name || activeCompany.subdomain || `inst_${activeCompany.id || 'default'}`).trim();

  // Auto-poll WhatsApp connection status while QR code modal is open
  React.useEffect(() => {
    if (!showQrModal) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceName: effectiveInstanceName,
            apiUrl: whatsappInstance.api_url,
            apiKey: whatsappInstance.api_key,
            companyId: activeCompany.id,
          }),
        });
        const data = await res.json();
        if (data.connected) {
          updateWhatsAppStatus('connected');
          setShowQrModal(false);
        }
      } catch (e) {
        // silent polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showQrModal, effectiveInstanceName, whatsappInstance.api_url, whatsappInstance.api_key, updateWhatsAppStatus]);

  const activeLead = leads.find((l) => l.id === activeChatLeadId) || leads[0];
  const activeChat = activeLead ? conversations[activeLead.id] || [] : [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeLead) return;

    await sendMessage(activeLead.id, inputText.trim());
    setInputText('');
  };

  const handleReconnect = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      updateWhatsAppStatus('connected');
      setIsRefreshing(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    updateWhatsAppStatus('disconnected');
    setQrCodeData(null);
  };

  const handleOpenConnectQr = async () => {
    setShowQrModal(true);
    setIsLoadingQr(true);
    setQrError(null);

    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName: effectiveInstanceName,
          apiUrl: whatsappInstance.api_url,
          apiKey: whatsappInstance.api_key,
          companyId: activeCompany.id,
        }),
      });

      const data = await res.json();

      if (data.connected) {
        updateWhatsAppStatus('connected');
        setShowQrModal(false);
      } else if (data.qrcode) {
        setQrCodeData(data.qrcode);
        updateWhatsAppStatus('qrcode');
      } else if (data.error) {
        setQrError(data.error);
      } else {
        setQrError(data.message || 'Aguardando inicialização da instância na Evolution API. Tente novamente em alguns segundos.');
      }
    } catch (err: any) {
      setQrError(err.message || 'Falha ao gerar QR Code na Evolution API');
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleQrScanned = () => {
    updateWhatsAppStatus('connected');
    setShowQrModal(false);
  };

  const handleCopyWebhook = () => {
    const baseUrl = whatsappInstance.webhook_url || 'https://crm.carloscalio.tech/api/webhooks/evolution';
    const webhookUrl = baseUrl.includes('company_id=')
      ? baseUrl
      : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}company_id=${encodeURIComponent(activeCompany.id)}`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 max-w-7xl mx-auto overflow-hidden">
      {/* Top Header: Instance Status & Actions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              whatsappInstance.status === 'connected'
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : whatsappInstance.status === 'qrcode'
                ? 'bg-amber-500 shadow-amber-500/30'
                : 'bg-red-500 shadow-red-500/30'
            }`}
          >
            {whatsappInstance.status === 'connected' ? (
              <Wifi className="w-6 h-6" />
            ) : (
              <WifiOff className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Instância WhatsApp: {whatsappInstance.instance_name}
              </h1>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                  whatsappInstance.status === 'connected'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : whatsappInstance.status === 'qrcode'
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                    : 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                }`}
              >
                {whatsappInstance.status === 'connected'
                  ? 'Conectado'
                  : whatsappInstance.status === 'qrcode'
                  ? 'Aguardando Leitura do QR'
                  : 'Desconectado'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Evolution API v2 • Número: {formatPhone(whatsappInstance.phone_number || '551199887766')} • Perfil: {whatsappInstance.profile_name}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          {whatsappInstance.status !== 'connected' ? (
            <button
              onClick={handleOpenConnectQr}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Conectar via QR Code
            </button>
          ) : (
            <>
              <button
                onClick={handleReconnect}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Reconectar
              </button>
              <button
                onClick={handleDisconnect}
                className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                Desconectar
              </button>
            </>
          )}

          <button
            onClick={handleCopyWebhook}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5"
            title="Copiar URL do Webhook nativo"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedWebhook ? 'Copiado!' : 'Webhook URL'}
          </button>
        </div>
      </div>

      {/* WhatsApp Multi-Contact Chat Inbox */}
      <div className="flex-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex overflow-hidden min-h-[540px]">
        {/* Contact List */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 mb-2">
              Conversas Recentes
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {leads.map((lead) => {
              const msgs = conversations[lead.id] || [];
              const lastMsg = msgs[msgs.length - 1];
              const isSelected = activeChatLeadId === lead.id;

              return (
                <div
                  key={lead.id}
                  onClick={() => setActiveChatLeadId(lead.id)}
                  className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                      : 'hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 ring-1 ring-zinc-300 dark:ring-zinc-700">
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {lead.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400">
                        {lastMsg ? formatRelativeTime(lastMsg.created_at) : ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 truncate">
                      {lastMsg ? lastMsg.content : 'Nenhuma mensagem recente'}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      {!lead.is_organic ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center gap-0.5">
                          {lead.platform === 'facebook' ? (
                            <FacebookIcon className="w-2.5 h-2.5" />
                          ) : (
                            <InstagramIcon className="w-2.5 h-2.5" />
                          )}
                          CTWA
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Orgânico
                        </span>
                      )}

                      {lead.sale_status === 'paid' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Venda Paga
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Chat Conversation Feed */}
        {activeLead ? (
          <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950">
            {/* Chat Header */}
            <div className="px-6 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700">
                  {activeLead.avatar_url ? (
                    <img
                      src={activeLead.avatar_url}
                      alt={activeLead.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                      {activeLead.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {activeLead.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {formatPhone(activeLead.phone)}
                  </p>
                </div>
              </div>

              {/* CTWA Context Banner in chat */}
              {!activeLead.is_organic && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] text-blue-800 dark:text-blue-300">
                    <strong>{activeLead.campaign_name || 'Campanha'}</strong> • {activeLead.ad_name || 'Criativo'}
                  </span>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeChat.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.is_from_me ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                      msg.is_from_me
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enviar mensagem via Evolution API..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs">
            Selecione uma conversa ao lado.
          </div>
        )}
      </div>

      {/* QR Code Connection Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Escaneie o QR Code no WhatsApp
            </h3>
            <p className="text-xs text-zinc-500">
              Abra o WhatsApp no seu smartphone → Aparelhos Conectados → Conectar um Aparelho.
            </p>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-emerald-500 inline-block shadow-md min-h-[220px] flex items-center justify-center">
              {isLoadingQr ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Gerando QR Code na Evolution API...</span>
                </div>
              ) : qrError ? (
                <div className="p-3 text-red-500 text-xs flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  <span>{qrError}</span>
                  <button
                    onClick={handleOpenConnectQr}
                    className="mt-1 px-3 py-1 rounded bg-zinc-100 text-zinc-800 text-[11px] font-bold"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : qrCodeData ? (
                <img
                  src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`}
                  alt="QR Code WhatsApp"
                  className="w-48 h-48 mx-auto object-contain"
                />
              ) : (
                <div className="text-xs text-zinc-400">Aguardando QR Code...</div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleQrScanned}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Confirmar Conexão do Aparelho
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium cursor-pointer"
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
