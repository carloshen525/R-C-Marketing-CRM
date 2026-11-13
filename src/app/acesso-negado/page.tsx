'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, Home } from 'lucide-react';

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <Lock className="w-3.5 h-3.5" />
            403 • Acesso Restrito
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Acesso Negado
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Esta área é exclusiva para <strong>super administradores da R&C Marketing</strong>. Clientes contratantes devem utilizar o painel operacional de sua respectiva empresa.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-left text-xs font-mono space-y-1.5 text-zinc-400">
          <div><span className="text-zinc-600">Regra de Segurança:</span> Isolamento estrito por Tenant</div>
          <div><span className="text-zinc-600">Tentativa registrada:</span> Rota administrativa restrita</div>
          <div><span className="text-zinc-600">Status:</span> Bloqueado pelo Middleware R&C</div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/dashboard"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Home className="w-4 h-4" />
            Voltar ao Meu Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
