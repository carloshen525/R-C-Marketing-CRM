'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { Users, Shield, Plus, Building2, Mail, Phone, Calendar, UserCheck, Search } from 'lucide-react';

export default function AdminUsuariosPage() {
  const { allUsers, companies, currentUser } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'super_admin' | 'client_admin' | 'user'>('all');

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Gestão Global de Usuários
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
              Master Admin
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Controle de administradores Master e usuários das empresas clientes em todo o SaaS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-2 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700">
            Total: {allUsers.length} usuários
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRoleFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            Todos ({allUsers.length})
          </button>
          <button
            onClick={() => setSelectedRoleFilter('super_admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRoleFilter === 'super_admin'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-500/10 text-rose-500'
            }`}
          >
            <Shield className="w-3 h-3" />
            Super Admins
          </button>
          <button
            onClick={() => setSelectedRoleFilter('client_admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRoleFilter === 'client_admin'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-500/10 text-blue-500'
            }`}
          >
            <Building2 className="w-3 h-3" />
            Admins Clientes
          </button>
          <button
            onClick={() => setSelectedRoleFilter('user')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRoleFilter === 'user'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            Atendentes
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Permissão / Role</th>
                <th className="py-3 px-4">Tenant / Empresa</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.map((user) => {
                const company = companies.find((c) => c.id === user.company_id);
                const isSuper = user.role === 'super_admin' || user.role === 'master_admin';

                return (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {user.full_name}
                            {user.id === currentUser.id && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="text-zinc-500 text-[11px]">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <Shield className="w-3 h-3" />
                          super_admin (Master)
                        </span>
                      ) : user.role === 'client_admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <Building2 className="w-3 h-3" />
                          client_admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          <UserCheck className="w-3 h-3" />
                          user (Atendente)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {isSuper ? (
                        <span className="text-[11px] font-mono text-zinc-400">
                          tenant_id: NULL (Acesso Global)
                        </span>
                      ) : (
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">
                            {company?.trade_name || company?.name || 'Empresa Vinculada'}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400">
                            {company?.subdomain}.rcmarketingcrm.com.br
                          </p>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ativo
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right text-zinc-400 font-mono text-[11px]">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
