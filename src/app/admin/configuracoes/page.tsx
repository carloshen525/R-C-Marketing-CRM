'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import {
  Settings,
  Shield,
  Server,
  Zap,
  Lock,
  Globe,
  Database,
  Save,
  CheckCircle2,
  RefreshCw,
  BellRing
} from 'lucide-react';

export default function AdminConfiguracoesPage() {
  const { masterMetrics } = useCRM();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [platformName, setPlatformName] = useState('R&C Marketing CRM');
  const [rootDomain, setRootDomain] = useState('rcmarketingcrm.com.br');
  const [adminSubdomain, setAdminSubdomain] = useState('admin');
  const [evolutionDefaultUrl, setEvolutionDefaultUrl] = useState('https://prospeccao-evolution01.pesd8y.easypanel.host');
  const [metaGraphVersion, setMetaGraphVersion] = useState('v20.0');
  const [enableAuditLogs, setEnableAuditLogs] = useState(true);
  const [enforceMfaForAdmins, setEnforceMfaForAdmins] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Configurações do SaaS (Master)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
              Master Admin
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Parâmetros globais do ecossistema R&C Marketing CRM, DNS multi-tenant e segurança.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dominio & Multi-tenant */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>Domínio & Roteamento de Subdomínios</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-500 font-bold uppercase text-[11px] mb-1">
                Nome da Plataforma
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-500 font-bold uppercase text-[11px] mb-1">
                Domínio Raiz (Wildcard DNS)
              </label>
              <input
                type="text"
                value={rootDomain}
                onChange={(e) => setRootDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Subdomínios gerados: <code className="font-mono text-emerald-600">[empresa].{rootDomain}</code>
              </p>
            </div>

            <div>
              <label className="block text-zinc-500 font-bold uppercase text-[11px] mb-1">
                Subdomínio Exclusivo Master
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={adminSubdomain}
                  onChange={(e) => setAdminSubdomain(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-zinc-400 font-mono text-xs">.{rootDomain}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integrações Padrão */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
            <Server className="w-4 h-4 text-emerald-500" />
            <span>Provedores & Versões Globais</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-500 font-bold uppercase text-[11px] mb-1">
                Evolution API Host Padrão
              </label>
              <input
                type="text"
                value={evolutionDefaultUrl}
                onChange={(e) => setEvolutionDefaultUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-500 font-bold uppercase text-[11px] mb-1">
                Meta Graph API Version
              </label>
              <select
                value={metaGraphVersion}
                onChange={(e) => setMetaGraphVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="v20.0">v20.0 (Mais Recente)</option>
                <option value="v19.0">v19.0 (Estável)</option>
                <option value="v18.0">v18.0</option>
              </select>
            </div>
          </div>
        </div>

        {/* Segurança e Políticas */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Políticas de Segurança e Isolamento</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceMfaForAdmins}
                onChange={(e) => setEnforceMfaForAdmins(e.target.checked)}
                className="mt-0.5 rounded border-zinc-400 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">Exigir MFA para Super Admins</p>
                <p className="text-[11px] text-zinc-500">
                  Solicita autenticação de dois fatores ao acessar o Painel Master ou editar empresas.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAuditLogs}
                onChange={(e) => setEnableAuditLogs(e.target.checked)}
                className="mt-0.5 rounded border-zinc-400 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">Trilha de Auditoria CAPI & Instâncias</p>
                <p className="text-[11px] text-zinc-500">
                  Registra todas as alterações de tokens Meta e instâncias da Evolution API em log imutável.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Salvar Parâmetros Globais
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
