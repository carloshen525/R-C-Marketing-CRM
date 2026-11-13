'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { formatPhone } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Power,
  Copy,
  Building2,
  Lock,
  Plus,
  QrCode,
  ShieldAlert,
} from 'lucide-react';

export default function MasterWhatsAppInstancesPage() {
  const { companies, getAllWhatsAppInstances, updateTenantEvolutionConfig } = useCRM();
  const instances = getAllWhatsAppInstances();
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
            Painel Master R&C
          </span>
        </div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Gestão Central de Instâncias Evolution API
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Monitoramento e administração técnica das instâncias isoladas do WhatsApp Baileys alocadas para cada cliente.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
        <Lock className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-bold">Isolamento Técnico Total:</span> Cada empresa possui seu próprio container / instância no cluster Evolution API. O cliente nunca visualiza a API Key, URL ou sessões de outros clientes.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((c) => {
          const inst = instances[c.id];
          const isConnected = inst?.status === 'connected';

          return (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-zinc-500 uppercase">
                    Instância: <span className="text-zinc-900 dark:text-zinc-100">{inst?.instance_name || c.subdomain}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isConnected
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {isConnected ? '🟢 Conectada' : '🔴 Desconectada'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{c.name}</h4>
                    <p className="text-[11px] text-zinc-500 font-mono">{formatPhone(inst?.phone_number || c.phone)}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 font-mono text-[11px] space-y-1">
                  <div className="text-zinc-500 truncate">
                    API: {inst?.api_url || 'https://evolution.rcmarketing.com.br'}
                  </div>
                  <div className="text-zinc-500 truncate">
                    Key: ••••••••••••••••
                  </div>
                  <div className="text-zinc-500 truncate">
                    Webhook: /api/webhooks/evolution
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    updateTenantEvolutionConfig(c.id, {
                      status: isConnected ? 'disconnected' : 'connected',
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    isConnected
                      ? 'border border-red-200 text-red-600 hover:bg-red-50'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isConnected ? 'Desconectar' : 'Conectar'}
                </button>

                <button
                  onClick={() => alert(`Instância ${inst?.instance_name} reiniciada com sucesso na Evolution API.`)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
