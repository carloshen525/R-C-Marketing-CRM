'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { formatPhone } from '@/lib/utils';
import { FacebookIcon, InstagramIcon } from '@/components/ui/icons';
import {
  Users,
  RefreshCw,
  Search,
  MessageSquare,
  Megaphone,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Layers,
} from 'lucide-react';

interface ContactItem {
  id: string;
  jid: string;
  phone: string;
  lid?: string;
  name: string;
  isGroup: boolean;
  lastMessage: string;
  lastMessageAt: string;
  fromMe: boolean;
  platform: 'instagram' | 'facebook' | 'organic';
  isAd: boolean;
  adTitle?: string;
  ctwaClid?: string;
  sourceId?: string;
  avatarUrl?: string;
  inCrm: boolean;
  leadId?: string;
  stageId?: string;
}

interface ContactsResponse {
  status: string;
  companyId: string;
  instance: string;
  fetchedAt: string;
  totalChats: number;
  directCount: number;
  groupCount: number;
  adCount: number;
  inCrmCount: number;
  contacts: ContactItem[];
  groups: ContactItem[];
}

type ContactFilter = 'all' | 'ads' | 'not_in_crm' | 'in_crm';

function formatContactDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  return date.toLocaleDateString('pt-BR');
}

function displayPhone(contact: ContactItem): string {
  if (!contact.phone) return 'Sem telefone';
  return formatPhone(contact.phone);
}

export default function ContactsPage() {
  const { activeCompany, whatsappInstance } = useCRM();

  const [data, setData] = useState<ContactsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ContactFilter>('all');
  const [showGroups, setShowGroups] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const loadContacts = useCallback(
    async (silent = false) => {
      if (!activeCompany.id) return;

      if (!silent) setIsLoading(true);

      try {
        const params = new URLSearchParams({ company_id: activeCompany.id });
        if (whatsappInstance.instance_name) {
          params.set('instance', whatsappInstance.instance_name);
        }

        const res = await fetch(`/api/whatsapp/contacts?${params.toString()}`, {
          cache: 'no-store',
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Falha ao carregar contatos da instância.');
        }

        setData(json as ContactsResponse);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Falha ao carregar contatos da instância.'
        );
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [activeCompany.id, whatsappInstance.instance_name]
  );

  useEffect(() => {
    const firstLoad = setTimeout(() => {
      void loadContacts();
    }, 0);
    const interval = setInterval(() => {
      void loadContacts(true);
    }, 30000);
    return () => {
      clearTimeout(firstLoad);
      clearInterval(interval);
    };
  }, [loadContacts]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);

  const handleSync = async () => {
    if (!activeCompany.id) return;
    setIsSyncing(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch('/api/leads/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: activeCompany.id,
          instance: whatsappInstance.instance_name || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Falha ao sincronizar leads.');
      }

      setNotice(
        `Sincronização concluída: ${json.addedCount ?? 0} novo(s) lead(s) importado(s).`
      );
      await loadContacts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao sincronizar leads.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async (contact: ContactItem) => {
    if (!activeCompany.id || contact.isGroup || !contact.phone) return;

    setImportingId(contact.id);
    setError(null);
    setNotice(null);

    try {
      const now = new Date().toISOString();
      const payload = {
        id: `lead_wa_${contact.phone}`,
        company_id: activeCompany.id,
        stage_id: 'stage_1',
        name: contact.name || `Contato ${contact.phone.slice(-4)}`,
        phone: contact.phone,
        lid: contact.lid,
        avatar_url: contact.avatarUrl,
        is_organic: !contact.isAd,
        ctwa_clid: contact.ctwaClid,
        source_id: contact.sourceId,
        platform: contact.platform,
        ad_name: contact.adTitle,
        lead_submitted_sent: false,
        sale_amount: 0,
        currency: 'BRL',
        sale_status: 'none',
        purchase_sent: false,
        purchase_meta_status: 'none',
        first_message_at: contact.lastMessageAt,
        last_interaction_at: contact.lastMessageAt,
        created_at: contact.lastMessageAt,
        updated_at: now,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Falha ao importar contato.');
      }

      setNotice(`${contact.name} foi importado para o CRM.`);
      await loadContacts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar contato.');
    } finally {
      setImportingId(null);
    }
  };

  const filteredContacts = useMemo(() => {
    const sourceList = showGroups ? data?.groups || [] : data?.contacts || [];
    const term = search.trim().toLowerCase();

    return sourceList.filter((contact) => {
      const matchesSearch =
        !term ||
        contact.name.toLowerCase().includes(term) ||
        contact.phone.includes(term) ||
        (contact.lid && contact.lid.includes(term)) ||
        contact.lastMessage.toLowerCase().includes(term) ||
        (contact.adTitle && contact.adTitle.toLowerCase().includes(term));

      const matchesFilter =
        showGroups ||
        filter === 'all' ||
        (filter === 'ads' && contact.isAd) ||
        (filter === 'in_crm' && contact.inCrm) ||
        (filter === 'not_in_crm' && !contact.inCrm);

      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter, showGroups]);

  const stats = [
    {
      label: showGroups ? 'Grupos' : 'Contatos diretos',
      value: showGroups ? data?.groupCount ?? 0 : data?.directCount ?? 0,
      icon: showGroups ? Layers : Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Com anúncio',
      value: showGroups ? 0 : data?.adCount ?? 0,
      icon: Megaphone,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
    },
    {
      label: 'Já no CRM',
      value: showGroups ? 0 : data?.inCrmCount ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Fora do CRM',
      value: showGroups ? 0 : Math.max(0, (data?.directCount ?? 0) - (data?.inCrmCount ?? 0)),
      icon: UserPlus,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Contatos WhatsApp
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {data?.instance || whatsappInstance.instance_name || 'Sem instância'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Contatos reais retornados diretamente pela Evolution API, independente de já
            estarem no funil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadContacts()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isSyncing ? 'Sincronizando...' : 'Sincronizar CRM'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {stat.label}
                </span>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGroups(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              !showGroups
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Contatos ({data?.directCount ?? 0})
          </button>
          <button
            onClick={() => setShowGroups(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              showGroups
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Grupos ({data?.groupCount ?? 0})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, telefone ou mensagem..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {!showGroups && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ContactFilter)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              <option value="all">Todos</option>
              <option value="ads">Com anúncio</option>
              <option value="not_in_crm">Fora do CRM</option>
              <option value="in_crm">Já no CRM</option>
            </select>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {filteredContacts.length} {showGroups ? 'grupo(s)' : 'contato(s)'} exibido(s)
          </span>
          {data?.fetchedAt && (
            <span className="text-[10px] text-zinc-400">
              Atualizado {formatContactDate(data.fetchedAt)}
            </span>
          )}
        </div>

        {isLoading && !data ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            Carregando contatos da instância...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-center">
            <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Nenhum contato encontrado
            </p>
            <p className="text-xs text-zinc-500 max-w-md">
              A Evolution API não retornou contatos para a instância
              <strong> {data?.instance || whatsappInstance.instance_name}</strong>. Verifique se
              a instância está conectada e se o nome está correto.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="px-4 py-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700">
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-600 dark:text-zinc-300">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[240px]">
                      {contact.name}
                    </h3>

                    {contact.isGroup ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        Grupo
                      </span>
                    ) : contact.isAd ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        {contact.platform === 'facebook' ? (
                          <FacebookIcon className="w-2.5 h-2.5" />
                        ) : (
                          <InstagramIcon className="w-2.5 h-2.5" />
                        )}
                        Anúncio
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        Orgânico
                      </span>
                    )}

                    {contact.inCrm ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        No CRM
                      </span>
                    ) : (
                      !contact.isGroup && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          Fora do CRM
                        </span>
                      )
                    )}
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
                    <span className="font-mono" title={contact.phone}>
                      {displayPhone(contact)}
                    </span>
                    {contact.adTitle && (
                      <span className="truncate max-w-[260px]">Anúncio: {contact.adTitle}</span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-500 truncate mt-1">
                    {contact.lastMessage || 'Sem mensagem recente'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[10px] text-zinc-400">
                    {formatContactDate(contact.lastMessageAt)}
                  </span>

                  {!contact.isGroup && !contact.inCrm && (
                    <button
                      onClick={() => handleImport(contact)}
                      disabled={importingId === contact.id || !contact.phone}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 disabled:opacity-50 transition-colors"
                    >
                      {importingId === contact.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      Importar
                    </button>
                  )}

                  {contact.inCrm && (
                    <a
                      href="/crm"
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver CRM
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-zinc-500 flex items-start gap-2">
        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          Esta lista consulta a Evolution API em tempo real. Contatos que ainda não estão no CRM
          podem ser importados individualmente ou todos de uma vez pelo botão “Sincronizar CRM”.
        </p>
      </div>
    </div>
  );
}
