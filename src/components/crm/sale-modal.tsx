'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/crm-context';
import { formatCurrencyBRL, formatPhone } from '@/lib/utils';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  DollarSign,
  Calendar,
  Package,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export function SaleModal() {
  const { isSaleModalOpen, pendingWonLead, closeSaleModal, confirmSale, metaIntegration } = useCRM();

  const [productName, setProductName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [saleDate, setSaleDate] = useState('');
  const [sendToMeta, setSendToMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    if (pendingWonLead) {
      setProductName(pendingWonLead.product_name || 'Produto Principal');
      setAmount(pendingWonLead.sale_amount > 0 ? pendingWonLead.sale_amount : 1997.0);
      setSaleDate(new Date().toISOString().split('T')[0]);
      // If organic lead, disable Meta checkbox by default
      setSendToMeta(!pendingWonLead.is_organic && Boolean(pendingWonLead.ctwa_clid));
      setResultError(null);
    }
  }, [pendingWonLead]);

  if (!isSaleModalOpen || !pendingWonLead) return null;

  const isOrganic = pendingWonLead.is_organic || !pendingWonLead.ctwa_clid;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Por favor, informe um valor de venda válido.');
      return;
    }

    setIsSubmitting(true);
    setResultError(null);

    const res = await confirmSale(pendingWonLead.id, {
      amount,
      productName,
      saleDate: new Date(saleDate).toISOString(),
      sendToMeta: !isOrganic && sendToMeta,
    });

    setIsSubmitting(false);

    if (!res.success && res.error) {
      setResultError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Confirmar Venda Concluída</h2>
              <p className="text-xs text-emerald-100">Registrar faturamento e despachar Purchase para Meta CAPI</p>
            </div>
          </div>
          <button
            onClick={closeSaleModal}
            className="text-white/80 hover:text-white rounded-lg p-1 transition-colors hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5">
          {/* Client Details Preview */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cliente</span>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{pendingWonLead.name}</p>
              <p className="text-xs text-zinc-500">{formatPhone(pendingWonLead.phone)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Origem</span>
              <div className="mt-1">
                {isOrganic ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300">
                    Orgânico
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    Meta Ads CTWA
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-zinc-500" />
              Produto ou Serviço (Opcional)
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Mentoria Escala 360, Consultoria, Curso..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Valor da Venda (BRL) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-zinc-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Data da Venda *
              </label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Meta Ads Tracking / Conversions API Checkbox */}
          <div className="rounded-xl border p-4 transition-colors bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
            {isOrganic ? (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Lead orgânico - sem rastreamento Meta.
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Este contato não veio através de um anúncio Click-to-WhatsApp (sem ctwa_clid). A venda será registrada no CRM sem envio de evento à Meta.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendToMeta}
                    onChange={(e) => setSendToMeta(e.target.checked)}
                    className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700"
                  />
                  <div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Enviar conversão para Meta (Purchase CAPI)
                    </span>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Dispara automaticamente o evento <span className="font-mono font-semibold">Purchase</span> para o Pixel {metaIntegration.pixel_id} com o valor de {formatCurrencyBRL(amount)} e o ID de clique <span className="font-mono text-[11px] bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">{pendingWonLead.ctwa_clid?.substring(0, 14)}...</span>
                    </p>
                  </div>
                </label>

                {pendingWonLead.campaign_name && (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-7 space-y-0.5">
                    <div><span className="font-medium text-zinc-600 dark:text-zinc-300">Campanha:</span> {pendingWonLead.campaign_name}</div>
                    <div><span className="font-medium text-zinc-600 dark:text-zinc-300">Anúncio:</span> {pendingWonLead.ad_name || 'Padrão'}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error notice if Meta failed */}
          {resultError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold">Erro ao enviar conversão:</span>
                <p className="mt-0.5">{resultError}</p>
              </div>
              <button
                type="button"
                onClick={handleConfirm}
                className="ml-3 shrink-0 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reenviar
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeSaleModal}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Venda
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
