'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Search, Plus, Sparkles, Shield, Building2, Lock, Globe, ExternalLink, ArrowLeft } from 'lucide-react';
import { NewLeadModal } from '../crm/new-lead-modal';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const {
    currentUser,
    activeCompany,
    addNewLead,
    environmentMode,
    setEnvironmentMode,
  } = useCRM();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  const handleSimulateCtwa = async () => {
    setIsSimulating(true);
    const names = ['Fernanda Castro', 'Diego Ribeiro', 'Beatriz Martins', 'Guilherme Neves'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomPhone = `55119${Math.floor(10000000 + Math.random() * 90000000)}`;
    const campaigns = [
      'Flores para Casamento & Buquês',
      'Assinatura Flores Corporativas',
      'Guincho Emergência 24 Horas',
    ];
    const chosenCampaign = campaigns[Math.floor(Math.random() * campaigns.length)];

    await addNewLead({
      name: randomName,
      phone: randomPhone,
      is_organic: false,
      ctwa_clid: `AR${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
      source_id: '12020584938210384',
      platform: 'instagram',
      campaign_name: chosenCampaign,
      ad_name: 'Anúncio Stories Vídeo 02',
    });

    setIsSimulating(false);
  };

  return (
    <>
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
        {/* Left: Subdomain or Master Admin Indicator */}
        <div className="flex items-center gap-3">
          {isSuperAdmin && environmentMode === 'master' ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Painel Master (Uso Interno R&C Marketing)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {activeCompany.name} • {activeCompany.full_subdomain}
              </span>
            </div>
          )}

          {/* Search Input */}
          <div className="relative w-80 hidden md:block">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                isSuperAdmin && environmentMode === 'master'
                  ? 'Buscar empresas, clientes, instâncias...'
                  : 'Buscar por lead, telefone, campanha...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isSuperAdmin && environmentMode === 'client' && (
            <button
              onClick={() => {
                setEnvironmentMode('master');
                router.push('/admin/empresas');
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao Master
            </button>
          )}

          {isSuperAdmin && environmentMode === 'master' ? (
            <>
              <Link
                href="/admin/empresas"
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Empresa
              </Link>
            </>
          ) : (
            <>
              {/* Client New Lead Manual Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Lead
              </button>
            </>
          )}

          {/* Role badge */}
          <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            {isSuperAdmin
              ? 'Super Admin'
              : currentUser.role === 'client_admin'
              ? 'Admin Cliente'
              : 'Atendente'}
          </div>

          {/* Login / Sair shortcut */}
          <Link
            href="/login"
            className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Ir para tela de Login / Trocar de Conta"
          >
            Sair
          </Link>
        </div>
      </header>

      <NewLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
