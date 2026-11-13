'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Lock, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { environmentMode, activeCompany } = useCRM();

  useEffect(() => {
    if (environmentMode === 'master') {
      router.replace('/master/empresas');
    } else {
      router.replace('/integracoes');
    }
  }, [environmentMode, router]);

  return (
    <div className="p-8 max-w-xl mx-auto text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Redirecionando para a área apropriada...
      </h2>
      <p className="text-xs text-zinc-500">
        As configurações técnicas foram centralizadas no Painel Master R&C Marketing, e o status das conexões está disponível em Status das Integrações.
      </p>
      <div className="pt-2">
        <Link
          href="/integracoes"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          Acessar Status das Integrações
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
