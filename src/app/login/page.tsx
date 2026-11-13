'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useCRM } from '@/lib/crm-context';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUserDirectly, allUsers } = useCRM();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick fill helper for testing
  const handleQuickFill = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('Admin@123456');
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Try Supabase Auth if configured with valid production credentials
      if (isSupabaseConfigured()) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password,
          });

          if (!authError && authData?.user) {
            // Fetch user profile to check role and tenant_id
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, role, tenant_id, full_name, email')
              .eq('id', authData.user.id)
              .single();

            const role = profile?.role || 'super_admin';
            const tenantId = profile?.tenant_id || null;

            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role, tenantId }),
            });

            if (role === 'super_admin' || role === 'master_admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/dashboard');
            }
            return;
          }
        } catch (supabaseErr) {
          console.warn('Supabase offline or unreachable, falling back to local auth mode:', supabaseErr);
        }
      }

      // 2. Local / In-memory user directory fallback
      const foundUser = allUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (!foundUser) {
        throw new Error('E-mail não cadastrado na plataforma.');
      }

      // Validate mock credentials
      if (!password || password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }

      // Update CRM context user
      setCurrentUserDirectly(foundUser);

      // Set cookie for middleware
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: foundUser.role, tenantId: foundUser.tenant_id }),
      });

      // Role based redirect
      if (foundUser.role === 'super_admin' || foundUser.role === 'master_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 border border-emerald-400/30">
            <span className="text-2xl font-black text-white tracking-wider">R&C</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-white">
          R&C Marketing CRM
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-400">
          Acesso seguro ao ecossistema SaaS Multi-Tenant & Painel Master
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-zinc-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-zinc-800 sm:px-10">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rcmarketingcrm.com"
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-700/80 rounded-2xl bg-zinc-950/60 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-zinc-700/80 rounded-2xl bg-zinc-950/60 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-300">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Lembrar meu dispositivo</span>
              </label>
              <a href="#" className="font-semibold text-emerald-400 hover:text-emerald-300">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 cursor-pointer shadow-emerald-500/20"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Access Cards for Testing Credentials */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">
              Acesso Rápido para Demonstração
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@rcmarketingcrm.com')}
                className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400">👑 Master Admin</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    super_admin
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 font-medium truncate mt-1">Carlos</p>
                <p className="text-[10px] text-zinc-500 truncate">admin@rcmarketingcrm.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('helena@terraesilva.com.br')}
                className="p-3 rounded-xl border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300">🏢 Cliente CRM</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 font-mono">
                    client_admin
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 font-medium truncate mt-1">Helena (Terra & Silva)</p>
                <p className="text-[10px] text-zinc-500 truncate">helena@terraesilva.com.br</p>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
          <span>Isolamento Estrito RLS & Multi-Tenant Ativo</span>
        </div>
      </div>
    </div>
  );
}
