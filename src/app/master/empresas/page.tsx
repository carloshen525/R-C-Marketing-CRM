'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Company, SaaSPlan, CompanyStatus } from '@/lib/types';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  Power,
  MessageSquare,
  ShieldCheck,
  Key,
  Globe,
  User,
  Mail,
  Phone,
  QrCode,
  RefreshCw,
  X,
  Lock,
} from 'lucide-react';

export default function MasterEmpresasPage() {
  const router = useRouter();
  const {
    companies,
    createCompany,
    updateCompany,
    toggleCompanyStatus,
    deleteCompany,
    setActiveCompanyId,
    setEnvironmentMode,
    getAllWhatsAppInstances,
    updateTenantEvolutionConfig,
    getAllMetaIntegrations,
    updateTenantMetaConfig,
    currentUser,
  } = useCRM();

  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/acesso-negado');
    }
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) {
    return null;
  }

  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // New Company Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<SaaSPlan>('pro');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(890);
  const [customPassword, setCustomPassword] = useState('');
  const [status, setStatus] = useState<CompanyStatus>('active');
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [isSubdomainManual, setIsSubdomainManual] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    url: string;
    email: string;
    tempPass: string;
    companyName: string;
  } | null>(null);

  // Edit Company Modal state
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editName, setEditName] = useState('');
  const [editTradeName, setEditTradeName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPlan, setEditPlan] = useState<SaaSPlan>('pro');
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<number>(890);
  const [editStatus, setEditStatus] = useState<CompanyStatus>('active');

  // Technical Modals state
  const [selectedCompanyForEvo, setSelectedCompanyForEvo] = useState<Company | null>(null);
  const [selectedCompanyForMeta, setSelectedCompanyForMeta] = useState<Company | null>(null);

  // Evolution instances list from server
  const [availableEvoInstances, setAvailableEvoInstances] = useState<any[]>([]);
  const [loadingEvoInstances, setLoadingEvoInstances] = useState(false);

  useEffect(() => {
    if (!selectedCompanyForEvo) return;
    setLoadingEvoInstances(true);
    fetch('/api/whatsapp/instances')
      .then((res) => res.json())
      .then((data) => {
        if (data.instances) {
          setAvailableEvoInstances(data.instances);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEvoInstances(false));
  }, [selectedCompanyForEvo]);

  const instances = getAllWhatsAppInstances();
  const metaIntegrations = getAllMetaIntegrations();

  // Auto-generate clean subdomain
  const autoSubdomain = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const effectiveSubdomain = isSubdomainManual ? customSubdomain : autoSubdomain;
  const isSubdomainAvailable = !companies.some(
    (c) => c.subdomain === effectiveSubdomain && c.id !== editingCompany?.id
  );

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSubdomainManual) {
      setCustomSubdomain(
        val
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '')
      );
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerName || !email || !phone) return;
    if (!isSubdomainAvailable || !effectiveSubdomain) {
      alert('Subdomínio inválido ou já em uso.');
      return;
    }

    const res = await createCompany({
      name,
      trade_name: tradeName || name,
      owner_name: ownerName,
      email,
      phone,
      plan,
      monthly_price: monthlyPrice,
      status,
      custom_subdomain: effectiveSubdomain,
      custom_password: customPassword || undefined,
    });

    const isCurrentHost = typeof window !== 'undefined' ? window.location.origin : 'https://prospeccao-recmarketingcrm.pesd8y.easypanel.host';
    const clientAccessUrl = `${isCurrentHost}/login`;

    setCreatedCredentials({
      url: clientAccessUrl,
      email: res.initialUser.email,
      tempPass: res.tempPassword,
      companyName: res.company.name,
    });

    // Reset fields
    setName('');
    setTradeName('');
    setOwnerName('');
    setEmail('');
    setPhone('');
    setCustomPassword('');
    setCustomSubdomain('');
    setIsSubdomainManual(false);
  };

  const handleStartEdit = (company: Company) => {
    setEditingCompany(company);
    setEditName(company.name);
    setEditTradeName(company.trade_name || '');
    setEditOwnerName(company.owner_name);
    setEditEmail(company.email);
    setEditPhone(company.phone);
    setEditPlan(company.plan);
    setEditMonthlyPrice(company.monthly_price !== undefined ? company.monthly_price : (company.plan === 'enterprise' ? 1490 : company.plan === 'pro' ? 890 : 490));
    setEditStatus(company.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    updateCompany(editingCompany.id, {
      name: editName,
      trade_name: editTradeName || editName,
      owner_name: editOwnerName,
      email: editEmail,
      phone: editPhone,
      plan: editPlan,
      monthly_price: editMonthlyPrice,
      status: editStatus,
    });

    setEditingCompany(null);
  };

  const handleOpenClientPanel = (companyId: string) => {
    setActiveCompanyId(companyId);
    setEnvironmentMode('client');
    router.push('/dashboard');
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subdomain.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = filterPlan === 'all' || c.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
              Painel Master R&C
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Gestão de Empresas Contratantes
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Cadastre novas empresas, gere subdomínios exclusivos e configure instâncias isoladas da Evolution API e credenciais Meta Ads CAPI.
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedCredentials(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Nova Empresa
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa, subdomínio ou responsável..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Plano:</span>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
            >
              <option value="all">Todos os Planos</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativa</option>
              <option value="suspended">Suspensa</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Empresa / Subdomínio</th>
                <th className="px-5 py-3.5">Responsável & Contato</th>
                <th className="px-5 py-3.5">Plano SaaS</th>
                <th className="px-5 py-3.5">Instância WhatsApp</th>
                <th className="px-5 py-3.5">Meta Ads CAPI</th>
                <th className="px-5 py-3.5">Status Conta</th>
                <th className="px-5 py-3.5 text-right">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredCompanies.map((c) => {
                const instance = instances[c.id];
                const meta = metaIntegrations[c.id];

                return (
                  <tr key={c.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                    {/* Company name & subdomain */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        {c.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/40 px-2 py-0.5 rounded font-bold">
                          {c.full_subdomain}
                        </span>
                      </div>
                    </td>

                    {/* Owner & contact */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">{c.owner_name}</div>
                      <div className="text-[11px] text-zinc-500">{c.email}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{c.phone}</div>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {c.plan}
                      </span>
                      <div className="text-[11px] font-bold text-emerald-600 mt-1">
                        R$ {c.monthly_price !== undefined ? c.monthly_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : (c.plan === 'enterprise' ? '1.490,00' : c.plan === 'pro' ? '890,00' : '490,00')}/mês
                      </div>
                    </td>

                    {/* WhatsApp Evolution instance info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            instance?.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <code className="text-[11px]">{instance?.instance_name || c.subdomain}</code>
                      </div>
                      <button
                        onClick={() => setSelectedCompanyForEvo(c)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold mt-1 flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Configurar Evolution
                      </button>
                    </td>

                    {/* Meta Ads info */}
                    <td className="px-5 py-3.5">
                      <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Pixel: <span className="font-mono text-zinc-500">{meta?.pixel_id?.slice(0, 10)}...</span>
                      </div>
                      <button
                        onClick={() => setSelectedCompanyForMeta(c)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-bold mt-1 flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Configurar Meta
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {c.status === 'active' ? 'Ativa' : 'Suspensa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                      {/* Access Client Panel */}
                      <button
                        onClick={() => handleOpenClientPanel(c.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                        title="Acessar o Painel do Cliente como esta empresa"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Painel do Cliente
                      </button>

                      {/* Edit Company */}
                      <button
                        onClick={() => handleStartEdit(c)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Editar Informações da Empresa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Suspend / Activate */}
                      <button
                        onClick={() => toggleCompanyStatus(c.id)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={c.status === 'active' ? 'Suspender conta' : 'Reativar conta'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir a empresa ${c.name}?`)) {
                            deleteCompany(c.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Excluir empresa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CADASTRO DE NOVA EMPRESA / CLIENTE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-zinc-950 px-6 py-4 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Cadastrar Nova Empresa (SaaS Multi-Tenant)</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form or Success Credentials View */}
            <div className="flex-1 overflow-y-auto p-6">
              {createdCredentials ? (
                /* Success & Access Credentials Receipt */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-black text-sm text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5" />
                      Empresa e Ambiente Isolado Criados com Sucesso!
                    </div>
                    <p>
                      O subdomínio exclusivo e o primeiro usuário administrador foram provisionados. O cliente deverá alterar a senha no primeiro acesso.
                    </p>
                  </div>

                  {/* Copyable Credentials Box */}
                  <div className="p-5 rounded-2xl bg-zinc-950 text-white font-mono text-xs space-y-3 border border-zinc-800">
                    <div className="text-zinc-400 text-[11px] uppercase tracking-wider font-bold">
                      Dados de Acesso do Cliente:
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div>
                        <span className="text-zinc-500">URL do Painel:</span>{' '}
                        <span className="text-emerald-400 font-bold">{createdCredentials.url}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Usuário:</span>{' '}
                        <span className="text-white font-bold">{createdCredentials.email}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Senha Inicial:</span>{' '}
                        <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                          {createdCredentials.tempPass}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const text = `Acesso ao R&C Marketing CRM:\nURL: ${createdCredentials.url}\nUsuário: ${createdCredentials.email}\nSenha Inicial: ${createdCredentials.tempPass}\n(Troca obrigatória no primeiro acesso)`;
                        navigator.clipboard.writeText(text);
                        alert('Dados de acesso copiados para a área de transferência!');
                      }}
                      className="w-full mt-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Dados de Acesso
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleCreateCompany} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ex: Terra e Silva Floricultura"
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Nome Fantasia (Opcional)
                      </label>
                      <input
                        type="text"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        placeholder="Ex: Terra & Silva Eventos"
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                  </div>

                  {/* Subdomain Preview & Manual Edit */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        Subdomínio Exclusivo do Cliente
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsSubdomainManual(!isSubdomainManual)}
                        className="text-[11px] font-bold text-emerald-600 hover:underline"
                      >
                        {isSubdomainManual ? 'Gerar Automático' : 'Editar Manualmente'}
                      </button>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="text"
                        required
                        value={effectiveSubdomain}
                        readOnly={!isSubdomainManual}
                        onChange={(e) => {
                          setIsSubdomainManual(true);
                          setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                        }}
                        className="px-3 py-2 rounded-l-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex-1"
                      />
                      <span className="px-3 py-2 rounded-r-xl border-y border-r border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 text-xs font-mono">
                        .carloscalio.tech
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      {isSubdomainAvailable ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Subdomínio disponível
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Subdomínio já está em uso!
                        </span>
                      )}
                      <span className="text-zinc-400">Instância Evolution: {effectiveSubdomain || '—'}</span>
                    </div>
                  </div>

                  {/* Owner & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Responsável *
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Ex: Helena Silva"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="helena@empresa.com"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="5511988771122"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Plan & Status & Custom Pricing */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Plano Base *
                      </label>
                      <select
                        value={plan}
                        onChange={(e) => {
                          const newPlan = e.target.value as SaaSPlan;
                          setPlan(newPlan);
                          setMonthlyPrice(newPlan === 'enterprise' ? 1490 : newPlan === 'pro' ? 890 : 490);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                      >
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Valor Mensal (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-zinc-400">R$</span>
                        <input
                          type="number"
                          required
                          step="10"
                          min="0"
                          value={monthlyPrice}
                          onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold font-mono"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400">Edição manual permitida</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Status Inicial *
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as CompanyStatus)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                      >
                        <option value="active">Ativa</option>
                        <option value="pending">Pendente</option>
                        <option value="suspended">Suspensa</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Custom Initial Password */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Senha Inicial do Usuário (Opcional)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Deixe em branco para gerar aleatório</span>
                    </label>
                    <input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Ex: Cliente@2026 (mínimo 6 dígitos)"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!isSubdomainAvailable}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 disabled:opacity-40"
                    >
                      Criar Empresa & Gerar Ambiente
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR INFORMAÇÕES DA EMPRESA */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-zinc-950 px-6 py-4 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Editar Empresa • {editingCompany.name}</h2>
              </div>
              <button
                onClick={() => setEditingCompany(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={editTradeName}
                    onChange={(e) => setEditTradeName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Plano Base
                  </label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as SaaSPlan)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Valor Mensal (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-zinc-400">R$</span>
                    <input
                      type="number"
                      required
                      step="10"
                      min="0"
                      value={editMonthlyPrice}
                      onChange={(e) => setEditMonthlyPrice(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as CompanyStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                  >
                    <option value="active">Ativa</option>
                    <option value="suspended">Suspensa</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIGURAÇÃO EVOLUTION API (MASTER ONLY) */}
      {selectedCompanyForEvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-zinc-950 px-6 py-4 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  Configuração Evolution API • {selectedCompanyForEvo.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCompanyForEvo(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Estas configurações são técnicas e exclusivas do Painel Master. O cliente nunca tem acesso a estes dados.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Nome da Instância Dedicada
                </label>
                <input
                  type="text"
                  value={instances[selectedCompanyForEvo.id]?.instance_name || selectedCompanyForEvo.subdomain}
                  onChange={(e) =>
                    updateTenantEvolutionConfig(selectedCompanyForEvo.id, { instance_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono font-bold"
                />

                {/* Evolution Instance Quick Selector */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Instâncias existentes na Evolution API:
                  </span>
                  {loadingEvoInstances ? (
                    <span className="text-[11px] text-zinc-400">Consultando Evolution API...</span>
                  ) : availableEvoInstances.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateTenantEvolutionConfig(selectedCompanyForEvo.id, {
                            instance_name: selectedCompanyForEvo.subdomain,
                          })
                        }
                        className="px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                      >
                        ⚡ Automática ({selectedCompanyForEvo.subdomain})
                      </button>
                      {availableEvoInstances.map((inst: any) => (
                        <button
                          key={inst.id || inst.name}
                          type="button"
                          onClick={() =>
                            updateTenantEvolutionConfig(selectedCompanyForEvo.id, {
                              instance_name: inst.name,
                            })
                          }
                          className="px-2 py-1 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 flex items-center gap-1"
                        >
                          <span>{inst.name}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${inst.connectionStatus === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400">Nenhuma instância cadastrada ainda. Uma nova será criada automaticamente ao conectar.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  URL da Evolution API
                </label>
                <input
                  type="text"
                  value={instances[selectedCompanyForEvo.id]?.api_url || 'https://prospeccao-evolution01.pesd8y.easypanel.host'}
                  onChange={(e) =>
                    updateTenantEvolutionConfig(selectedCompanyForEvo.id, { api_url: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  API Key da Instância
                </label>
                <input
                  type="password"
                  value={instances[selectedCompanyForEvo.id]?.api_key || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD'}
                  onChange={(e) =>
                    updateTenantEvolutionConfig(selectedCompanyForEvo.id, { api_key: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    🟢 Conectado
                  </span>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      alert('Comando de reinicialização da instância enviado para Evolution API.');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold"
                  >
                    Reiniciar Instância
                  </button>
                  <button
                    onClick={() => setSelectedCompanyForEvo(null)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIGURAÇÃO META ADS (MASTER ONLY) */}
      {selectedCompanyForMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-zinc-950 px-6 py-4 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  Configuração Meta Ads CAPI • {selectedCompanyForMeta.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCompanyForMeta(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>O Token Permanente da Meta fica gravado com segurança apenas no Painel Master.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Token Permanente da Conversions API (Graph API)
                </label>
                <input
                  type="password"
                  placeholder="Cole aqui o Token Permanente da Meta (EAAG...)"
                  value={metaIntegrations[selectedCompanyForMeta.id]?.access_token || ''}
                  onChange={(e) =>
                    updateTenantMetaConfig(selectedCompanyForMeta.id, { access_token: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Token permanente de longa duração para envio automático de conversões e eventos da Meta (Leads e Vendas).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyForMeta(null)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Salvar Parâmetros Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
