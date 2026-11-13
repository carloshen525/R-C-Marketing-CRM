'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import {
  ShieldCheck,
  Building2,
  Lock,
  Key,
  CheckCircle2,
  ExternalLink,
  Save,
} from 'lucide-react';

export default function MasterMetaAdsPage() {
  const router = useRouter();
  const { companies, getAllMetaIntegrations, updateTenantMetaConfig, currentUser } = useCRM();
  const metaIntegrations = getAllMetaIntegrations();
  const [savedCompanyId, setSavedCompanyId] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/acesso-negado');
    }
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) {
    return null;
  }

  const handleSave = (companyId: string) => {
    setSavedCompanyId(companyId);
    setTimeout(() => setSavedCompanyId(null), 2500);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
            Painel Master R&C
          </span>
        </div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Gestão Central de Tokens & Pixels Meta Ads (CAPI)
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Gerenciamento exclusivo das credenciais de alto nível da Meta Conversions API para cada empresa contratante.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-3">
        <Lock className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-bold">Segurança Rigorosa:</span> Tokens permanentes de System User, Pixel IDs, Dataset IDs e Webhook Secrets são mantidos exclusivamente no Painel Master e injetados de forma segura nas chamadas de backend. O cliente nunca tem acesso a essas chaves.
        </div>
      </div>

      <div className="space-y-6">
        {companies.map((c) => {
          const meta = metaIntegrations[c.id];

          return (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{c.name}</h3>
                    <p className="text-[11px] text-zinc-500 font-mono">{c.full_subdomain}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    🟢 CAPI Ativo (v20.0)
                  </span>
                  <button
                    onClick={() => handleSave(c.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savedCompanyId === c.id ? 'Salvo!' : 'Salvar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Pixel ID
                  </label>
                  <input
                    type="text"
                    value={meta?.pixel_id || ''}
                    onChange={(e) =>
                      updateTenantMetaConfig(c.id, { pixel_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Dataset ID
                  </label>
                  <input
                    type="text"
                    value={meta?.dataset_id || ''}
                    onChange={(e) =>
                      updateTenantMetaConfig(c.id, { dataset_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={meta?.page_id || ''}
                    onChange={(e) =>
                      updateTenantMetaConfig(c.id, { page_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Test Event Code
                  </label>
                  <input
                    type="text"
                    value={meta?.test_event_code || ''}
                    onChange={(e) =>
                      updateTenantMetaConfig(c.id, { test_event_code: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Token Permanente Meta (System User - Permissões ads_management + pixel)
                  </label>
                  <input
                    type="password"
                    value={meta?.access_token || ''}
                    onChange={(e) =>
                      updateTenantMetaConfig(c.id, { access_token: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
