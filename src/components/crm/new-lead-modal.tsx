'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { X, Sparkles, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewLeadModal({ isOpen, onClose }: NewLeadModalProps) {
  const { addNewLead } = useCRM();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('5511998765432');
  const [email, setEmail] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [campaignName, setCampaignName] = useState('Escala E-commerce 2026');
  const [adName, setAdName] = useState('Vídeo Depoimento - 120k em 30d');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);

    await addNewLead({
      name,
      phone,
      email: email || undefined,
      is_organic: isOrganic,
      ctwa_clid: isOrganic ? undefined : `AR${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
      source_id: isOrganic ? undefined : '12020584938210384',
      platform: isOrganic ? 'organic' : 'instagram',
      campaign_name: isOrganic ? undefined : campaignName,
      ad_name: isOrganic ? undefined : adName,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 dark:bg-zinc-950 px-6 py-4 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Adicionar Novo Lead</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fernanda Lima"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Telefone WhatsApp (com DDI e DDD) *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5511998765432"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Switcher: CTWA vs Organic */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
              Origem do Lead
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="radio"
                  name="origin"
                  checked={!isOrganic}
                  onChange={() => setIsOrganic(false)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Meta Ads (CTWA Rastreado)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="radio"
                  name="origin"
                  checked={isOrganic}
                  onChange={() => setIsOrganic(true)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Orgânico
              </label>
            </div>

            {!isOrganic ? (
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 block mb-0.5">Campanha</label>
                  <select
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  >
                    <option value="Escala E-commerce 2026">Escala E-commerce 2026</option>
                    <option value="Captação Clínicas & Médicos">Captação Clínicas & Médicos</option>
                    <option value="Imóveis Alto Padrão SP">Imóveis Alto Padrão SP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 block mb-0.5">Criativo / Anúncio</label>
                  <input
                    type="text"
                    value={adName}
                    onChange={(e) => setAdName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Irá disparar automaticamente o evento <strong>LeadSubmitted</strong> para Meta CAPI.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Lead orgânico: nenhum evento Meta CAPI será enviado.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
