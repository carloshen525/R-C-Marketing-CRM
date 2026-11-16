'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Company,
  Profile,
  WhatsAppInstance,
  MetaIntegration,
  PipelineStage,
  Lead,
  Tag,
  Message,
  MetaConversionLog,
  DashboardMetrics,
  MasterSaaSMetrics,
  ClientIntegrationStatus,
  UserRole,
  SaaSPlan,
  CompanyStatus,
} from './types';
import {
  initialCompanies,
  initialProfiles,
  initialWhatsAppInstances,
  initialMetaIntegrations,
  defaultPipelineStages,
  defaultTags,
  initialLeads,
  initialConversations,
  initialMetaLogs,
  initialDashboardMetrics,
  initialMasterSaaSMetrics,
} from './initial-data';
import { MetaConversionsService } from './meta/conversions-api.service';

export type EnvironmentMode = 'client' | 'master';

interface CRMContextType {
  // Environments & Multi-Tenant state
  environmentMode: EnvironmentMode;
  setEnvironmentMode: (mode: EnvironmentMode) => void;
  companies: Company[];
  activeCompany: Company;
  setActiveCompanyId: (companyId: string) => void;
  masterMetrics: MasterSaaSMetrics;

  // Master Admin CRUD Operations (Protected: super_admin only)
  createCompany: (companyData: {
    name: string;
    trade_name?: string;
    owner_name: string;
    email: string;
    phone: string;
    plan: SaaSPlan;
    monthly_price?: number;
    status: CompanyStatus;
    custom_subdomain?: string;
    custom_password?: string;
  }) => Promise<{ company: Company; initialUser: Profile; tempPassword: string }>;
  updateCompany: (id: string, partial: Partial<Company>) => void;
  toggleCompanyStatus: (id: string) => void;
  deleteCompany: (id: string) => void;
  
  // Master Technical Configuration (Evolution & Meta Ads per tenant - super_admin only)
  updateTenantEvolutionConfig: (companyId: string, partial: Partial<WhatsAppInstance>) => void;
  updateTenantMetaConfig: (companyId: string, partial: Partial<MetaIntegration>) => void;
  getAllWhatsAppInstances: () => Record<string, WhatsAppInstance>;
  getAllMetaIntegrations: () => Record<string, MetaIntegration>;

  // Client-Safe Integration Status (Zero leak of tokens/keys)
  clientIntegrationStatus: ClientIntegrationStatus;

  // Standard CRM State (Strictly filtered by tenant_id)
  currentUser: Profile;
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentUserDirectly: (user: Profile) => void;
  allUsers: Profile[];
  users: Profile[];
  leads: Lead[];
  stages: PipelineStage[];
  tags: Tag[];
  whatsappInstance: WhatsAppInstance;
  metaIntegration: MetaIntegration;
  dashboardMetrics: DashboardMetrics;
  conversations: Record<string, Message[]>;
  metaLogs: MetaConversionLog[];
  selectedLead: Lead | null;
  isSaleModalOpen: boolean;
  pendingWonLead: Lead | null;
  
  // Actions
  setSelectedLead: (lead: Lead | null) => void;
  openSaleModal: (lead: Lead) => void;
  closeSaleModal: () => void;
  moveLeadStage: (leadId: string, stageId: string) => void;
  confirmSale: (leadId: string, saleData: {
    amount: number;
    productName: string;
    saleDate: string;
    sendToMeta: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  retryConversion: (leadId: string) => Promise<void>;
  sendMessage: (leadId: string, content: string) => Promise<void>;
  updateLead: (leadId: string, partial: Partial<Lead>) => void;
  addNewLead: (leadData: Partial<Lead>) => Promise<Lead>;
  updateWhatsAppStatus: (status: WhatsAppInstance['status']) => void;
  addStage: (name: string, color: string) => void;
  syncWhatsAppLeads: () => Promise<void>;
  isSyncingLeads: boolean;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  // All system data in memory - Starts Clean for Real Production
  const [allCompanies, setAllCompanies] = useState<Company[]>(initialCompanies);
  const [allUsers, setAllUsers] = useState<Profile[]>(initialProfiles);
  const [allLeads, setAllLeads] = useState<Lead[]>(initialLeads);
  const [tenantEvolutionConfigs, setTenantEvolutionConfigs] = useState<Record<string, WhatsAppInstance>>(initialWhatsAppInstances);
  const [tenantMetaConfigs, setTenantMetaConfigs] = useState<Record<string, MetaIntegration>>(initialMetaIntegrations);
  const [conversations, setConversations] = useState<Record<string, Message[]>>(initialConversations);
  const [metaLogs, setMetaLogs] = useState<MetaConversionLog[]>(initialMetaLogs);
  const [masterMetrics, setMasterMetrics] = useState<MasterSaaSMetrics>(initialMasterSaaSMetrics);
  const [stages, setStages] = useState<PipelineStage[]>(defaultPipelineStages);
  const [tags] = useState<Tag[]>(defaultTags);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>(initialDashboardMetrics);

  // Current active user: Defaults to Carlos Henrique (Super Admin Owner)
  const [currentUser, setCurrentUser] = useState<Profile>(initialProfiles[0]);

  // Synchronize state with localStorage for persistent client logins in SaaS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCompanies = localStorage.getItem('rc_companies');
        if (savedCompanies) {
          setAllCompanies(JSON.parse(savedCompanies));
        }
        const savedUsers = localStorage.getItem('rc_users');
        if (savedUsers) {
          setAllUsers(JSON.parse(savedUsers));
        }
        const savedInstances = localStorage.getItem('rc_instances');
        if (savedInstances) {
          setTenantEvolutionConfigs(JSON.parse(savedInstances));
        }
        const savedMeta = localStorage.getItem('rc_meta');
        if (savedMeta) {
          setTenantMetaConfigs(JSON.parse(savedMeta));
        }
        const savedActiveUser = localStorage.getItem('rc_current_user');
        if (savedActiveUser) {
          setCurrentUser(JSON.parse(savedActiveUser));
        }
      } catch (e) {
        console.error('Failed to load state from localStorage', e);
      }
    }
  }, []);

  // Save changes to localStorage whenever companies or users change
  useEffect(() => {
    if (typeof window !== 'undefined' && allCompanies.length > 0) {
      try {
        localStorage.setItem('rc_companies', JSON.stringify(allCompanies));
      } catch (e) {}
    }
  }, [allCompanies]);

  useEffect(() => {
    if (typeof window !== 'undefined' && allUsers.length > 0) {
      try {
        localStorage.setItem('rc_users', JSON.stringify(allUsers));
      } catch (e) {}
    }
  }, [allUsers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rc_instances', JSON.stringify(tenantEvolutionConfigs));
      } catch (e) {}
    }
  }, [tenantEvolutionConfigs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rc_meta', JSON.stringify(tenantMetaConfigs));
      } catch (e) {}
    }
  }, [tenantMetaConfigs]);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser) {
      try {
        localStorage.setItem('rc_current_user', JSON.stringify(currentUser));
      } catch (e) {}
    }
  }, [currentUser]);

  // Current selected company ID
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>('');

  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [pendingWonLead, setPendingWonLead] = useState<Lead | null>(null);

  // Security helper: Is the current user super_admin?
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'master_admin';

  // Environment Mode: Can be toggled to 'client' by super_admin to inspect client accounts
  const [environmentMode, setEnvironmentModeState] = useState<EnvironmentMode>('master');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEnv = localStorage.getItem('rc_env_mode') as EnvironmentMode;
      const savedCompany = localStorage.getItem('rc_active_company');
      if (savedCompany) {
        setActiveCompanyIdState(savedCompany);
      }
      if (!isSuperAdmin) {
        setEnvironmentModeState('client');
      } else if (savedEnv) {
        setEnvironmentModeState(savedEnv);
      }
    }
  }, [isSuperAdmin]);

  const setEnvironmentMode = (mode: EnvironmentMode) => {
    if (mode === 'master' && !isSuperAdmin) {
      alert('Acesso negado: Painel Master restrito a super_admin');
      return;
    }
    setEnvironmentModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc_env_mode', mode);
    }
  };

  // Rule: If user is client, active company is strictly locked to their tenant_id!
  const resolvedCompanyId = useMemo(() => {
    if (!isSuperAdmin && currentUser.tenant_id) {
      return currentUser.tenant_id;
    }
    return activeCompanyId || (allCompanies[0]?.id || '');
  }, [isSuperAdmin, currentUser.tenant_id, activeCompanyId, allCompanies]);

  const activeCompany: Company = useMemo(() => {
    const found = allCompanies.find((c) => c.id === resolvedCompanyId);
    if (found) return found;
    return {
      id: '',
      name: 'R&C Marketing',
      trade_name: 'R&C Marketing CRM',
      slug: 'rcmarketing',
      subdomain: 'app',
      full_subdomain: 'app.rcmarketingcrm.com.br',
      owner_name: 'Carlos Henrique',
      email: 'carloshenrq1245@gmail.com',
      phone: '+55 62 8200-2147',
      plan: 'enterprise',
      status: 'active',
      timezone: 'America/Sao_Paulo',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
  }, [allCompanies, resolvedCompanyId]);

  const setActiveCompanyId = (companyId: string) => {
    if (!isSuperAdmin) {
      console.warn('[Security] Client user cannot switch companies.');
      return;
    }
    setActiveCompanyIdState(companyId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc_active_company', companyId);
    }
  };

  // STRICT TENANT ISOLATION:
  // Clients only see their own company. Super admin sees all.
  const companies = useMemo(() => {
    if (!isSuperAdmin) {
      return [activeCompany];
    }
    return allCompanies;
  }, [isSuperAdmin, activeCompany, allCompanies]);

  // STRICT TENANT ISOLATION:
  // Clients only see leads from their tenant. Super admin sees leads.
  const leads = useMemo(() => {
    if (!isSuperAdmin && currentUser.tenant_id) {
      return allLeads.filter((l) => l.company_id === currentUser.tenant_id);
    }
    if (environmentMode === 'client' && activeCompany.id) {
      return allLeads.filter(
        (l) => l.company_id === activeCompany.id || !l.company_id || l.company_id === 'comp_pedagogicos'
      );
    }
    return allLeads;
  }, [isSuperAdmin, currentUser.tenant_id, allLeads, environmentMode, activeCompany.id]);

  // STRICT TENANT ISOLATION:
  // Clients only see coworkers from their own tenant.
  const users = useMemo(() => {
    if (!isSuperAdmin && currentUser.tenant_id) {
      return allUsers.filter((u) => u.company_id === currentUser.tenant_id);
    }
    return allUsers;
  }, [isSuperAdmin, currentUser.tenant_id, allUsers]);

  // WhatsApp & Meta for active company (Starts clean and disconnected unless explicit credentials exist)
  const whatsappInstance = tenantEvolutionConfigs[activeCompany.id] || {
    id: `inst_${activeCompany.id || 'default'}`,
    company_id: activeCompany.id,
    instance_name: activeCompany.subdomain,
    api_url: 'https://prospeccao-evolution01.pesd8y.easypanel.host',
    api_key: '',
    status: 'disconnected',
    phone_number: '',
    profile_name: activeCompany.name,
    last_sync_at: 'Aguardando conexão',
    is_active: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  const metaIntegration = tenantMetaConfigs[activeCompany.id] || {
    id: `meta_${activeCompany.id || 'default'}`,
    company_id: activeCompany.id,
    pixel_id: '',
    access_token: '',
    page_id: '',
    graph_api_version: 'v20.0',
    last_conversion_sent_at: 'Nenhuma conversão enviada',
    is_active: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  // Client-Safe Integration Status
  const clientIntegrationStatus: ClientIntegrationStatus = {
    whatsapp: {
      isConnected: whatsappInstance.status === 'connected',
      statusText:
        whatsappInstance.status === 'connected'
          ? 'Online'
          : whatsappInstance.status === 'qrcode'
          ? 'Aguardando QR Code'
          : 'Desconectado',
      phoneNumber: whatsappInstance.phone_number,
      lastSyncAt: whatsappInstance.last_sync_at || 'Aguardando conexão',
      instanceName: whatsappInstance.instance_name,
    },
    metaAds: {
      isConnected: Boolean(metaIntegration.access_token || (metaIntegration.is_active && metaIntegration.pixel_id)),
      statusText:
        metaIntegration.access_token || (metaIntegration.is_active && metaIntegration.pixel_id)
          ? 'Conectado'
          : 'Desconectado',
      trackingActive: Boolean(metaIntegration.access_token || (metaIntegration.is_active && metaIntegration.pixel_id)),
      lastConversionSentAt: metaIntegration.last_conversion_sent_at || 'Nenhuma conversão enviada',
      leadsTrackedCount: leads.filter((l) => !l.is_organic).length,
      purchasesSentCount: leads.filter((l) => l.purchase_sent).length,
    },
  };

  // Role Switcher (Simulates login sessions)
  const setCurrentUserDirectly = (user: Profile) => {
    setCurrentUser(user);
    if (user.company_id) {
      setActiveCompanyIdState(user.company_id);
    }
  };

  const setCurrentUserRole = (role: UserRole) => {
    if (role === 'super_admin' || role === 'master_admin') {
      const superUser = allUsers.find((u) => u.role === 'super_admin' || u.role === 'master_admin') || allUsers[0];
      setCurrentUser(superUser);
    } else if (role === 'client_admin') {
      const clientAdmin = allUsers.find((u) => u.role === 'client_admin' && u.company_id === activeCompany.id) || allUsers[1];
      setCurrentUser(clientAdmin);
    } else {
      const agentUser = allUsers.find((u) => (u.role === 'user' || u.role === 'agent') && u.company_id === activeCompany.id) || allUsers[2];
      setCurrentUser(agentUser);
    }
  };

  // Sync leads & messages from server storage & Evolution API
  const [isSyncingLeads, setIsSyncingLeads] = useState(false);

  const syncWhatsAppLeads = useCallback(
    async (triggerEvolutionSync = true) => {
      try {
        setIsSyncingLeads(true);
        const activeInst = tenantEvolutionConfigs[activeCompany.id]?.instance_name || 'Carlos1';
        const companyId = activeCompany.id || 'comp_pedagogicos';
        const url = `/api/leads?company_id=${companyId}&instance=${activeInst}${
          triggerEvolutionSync ? '&sync=true' : ''
        }`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
          setAllLeads((prev) => {
            const merged = [...prev];
            for (const sLead of data.leads) {
              const idx = merged.findIndex(
                (l) => l.id === sLead.id || (sLead.phone && l.phone === sLead.phone)
              );
              const leadFormatted: Lead = {
                ...sLead,
                company_id: sLead.company_id || activeCompany.id || 'comp_pedagogicos',
              };
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...leadFormatted };
              } else {
                merged.unshift(leadFormatted);
              }
            }
            return merged;
          });
        }
        if (data.messages && typeof data.messages === 'object') {
          setConversations((prev) => ({
            ...prev,
            ...data.messages,
          }));
        }
      } catch (e) {
        console.warn('[CRM] Sync leads failed:', e);
      } finally {
        setIsSyncingLeads(false);
      }
    },
    [activeCompany.id, tenantEvolutionConfigs]
  );

  // Poll server for new leads every 5s and sync on mount
  useEffect(() => {
    syncWhatsAppLeads(true);
    const interval = setInterval(() => {
      syncWhatsAppLeads(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [syncWhatsAppLeads]);

  // Master: Create New Company (Blocked for clients)
  const createCompany = async (data: {
    name: string;
    trade_name?: string;
    owner_name: string;
    email: string;
    phone: string;
    plan: SaaSPlan;
    monthly_price?: number;
    status: CompanyStatus;
    custom_subdomain?: string;
    custom_password?: string;
  }) => {
    if (!isSuperAdmin) {
      throw new Error('Acesso Negado: Operação restrita a super_admin.');
    }

    const generateSubdomain = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

    const subdomain = data.custom_subdomain
      ? generateSubdomain(data.custom_subdomain)
      : generateSubdomain(data.name);

    const full_subdomain = `${subdomain}.rcmarketingcrm.com.br`;
    const companyId = `comp_${subdomain}_${Date.now()}`;
    const tempPassword = data.custom_password && data.custom_password.trim().length >= 6
      ? data.custom_password.trim()
      : `Rc#${Math.floor(100000 + Math.random() * 900000)}`;

    const newCompany: Company = {
      id: companyId,
      tenant_id: companyId,
      name: data.name,
      nome_empresa: data.name,
      trade_name: data.trade_name || data.name,
      slug: subdomain,
      subdomain,
      subdominio: subdomain,
      full_subdomain,
      owner_name: data.owner_name,
      email: data.email,
      phone: data.phone,
      plan: data.plan,
      monthly_price: data.monthly_price !== undefined ? data.monthly_price : (data.plan === 'enterprise' ? 1490 : data.plan === 'pro' ? 890 : 490),
      status: data.status,
      timezone: 'America/Sao_Paulo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const initialAdmin: Profile = {
      id: `user_${subdomain}_admin`,
      tenant_id: companyId,
      company_id: companyId,
      full_name: data.owner_name,
      email: data.email,
      role: 'client_admin',
      is_active: true,
      phone: data.phone,
      must_change_password: true,
      temporary_password: tempPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newEvolutionInstance: WhatsAppInstance = {
      id: `inst_${subdomain}`,
      company_id: companyId,
      tenant_id: companyId,
      instance_name: subdomain,
      api_url: 'https://prospeccao-evolution01.pesd8y.easypanel.host',
      api_key: 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD',
      status: 'disconnected',
      phone_number: data.phone.replace(/\D/g, ''),
      profile_name: data.trade_name || data.name,
      webhook_url: 'https://crm.rcmarketing.com.br/api/webhooks/evolution',
      last_sync_at: 'Recém criada',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newMetaIntegration: MetaIntegration = {
      id: `meta_${subdomain}`,
      company_id: companyId,
      tenant_id: companyId,
      pixel_id: `pixel_${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
      dataset_id: `dataset_${subdomain}`,
      access_token: `EAAG9_PERMANENT_TOKEN_${subdomain.toUpperCase()}`,
      graph_api_version: 'v20.0',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAllCompanies((prev) => [newCompany, ...prev]);
    setAllUsers((prev) => [...prev, initialAdmin]);
    setTenantEvolutionConfigs((prev) => ({ ...prev, [companyId]: newEvolutionInstance }));
    setTenantMetaConfigs((prev) => ({ ...prev, [companyId]: newMetaIntegration }));

    setMasterMetrics((prev) => ({
      ...prev,
      totalCompanies: prev.totalCompanies + 1,
      activeCompanies: data.status === 'active' ? prev.activeCompanies + 1 : prev.activeCompanies,
      mrrTotal: prev.mrrTotal + (data.plan === 'enterprise' ? 1490 : data.plan === 'pro' ? 890 : 490),
    }));

    return {
      company: newCompany,
      initialUser: initialAdmin,
      tempPassword,
    };
  };

  const updateCompany = (id: string, partial: Partial<Company>) => {
    if (!isSuperAdmin) throw new Error('Acesso Negado.');
    setAllCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...partial, updated_at: new Date().toISOString() } : c))
    );
  };

  const toggleCompanyStatus = (id: string) => {
    if (!isSuperAdmin) throw new Error('Acesso Negado.');
    setAllCompanies((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus: CompanyStatus = c.status === 'active' ? 'suspended' : 'active';
          return { ...c, status: nextStatus, updated_at: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  const deleteCompany = (id: string) => {
    if (!isSuperAdmin) throw new Error('Acesso Negado.');
    setAllCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  const updateTenantEvolutionConfig = (companyId: string, partial: Partial<WhatsAppInstance>) => {
    if (!isSuperAdmin) throw new Error('Acesso Negado.');
    setTenantEvolutionConfigs((prev) => ({
      ...prev,
      [companyId]: { ...prev[companyId], ...partial, updated_at: new Date().toISOString() },
    }));
  };

  const updateTenantMetaConfig = (companyId: string, partial: Partial<MetaIntegration>) => {
    if (!isSuperAdmin) throw new Error('Acesso Negado.');
    setTenantMetaConfigs((prev) => {
      const existing = prev[companyId] || {
        id: `meta_${companyId}`,
        company_id: companyId,
        pixel_id: '',
        access_token: '',
        page_id: '',
        graph_api_version: 'v20.0',
        last_conversion_sent_at: 'Nenhuma conversão enviada',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return {
        ...prev,
        [companyId]: {
          ...existing,
          ...partial,
          is_active: partial.access_token ? true : (partial.is_active ?? existing.is_active),
          updated_at: new Date().toISOString(),
        },
      };
    });
  };

  const getAllWhatsAppInstances = () => {
    if (!isSuperAdmin) return {};
    return tenantEvolutionConfigs;
  };

  const getAllMetaIntegrations = () => {
    if (!isSuperAdmin) return {};
    return tenantMetaConfigs;
  };

  // Sale Modal handlers
  const openSaleModal = (lead: Lead) => {
    setPendingWonLead(lead);
    setIsSaleModalOpen(true);
  };

  const closeSaleModal = () => {
    setIsSaleModalOpen(false);
    setPendingWonLead(null);
  };

  const moveLeadStage = (leadId: string, stageId: string) => {
    const targetStage = stages.find((s) => s.id === stageId);
    const targetLead = allLeads.find((l) => l.id === leadId);

    if (!targetStage || !targetLead) return;

    if (targetStage.is_won && targetLead.stage_id !== stageId) {
      openSaleModal(targetLead);
      return;
    }

    setAllLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage_id: stageId,
              updated_at: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const confirmSale = async (
    leadId: string,
    saleData: {
      amount: number;
      productName: string;
      saleDate: string;
      sendToMeta: boolean;
    }
  ) => {
    const targetLead = allLeads.find((l) => l.id === leadId);
    const wonStage = stages.find((s) => s.is_won) || stages[4];
    if (!targetLead) return { success: false, error: 'Lead não encontrado' };

    let metaStatus: Lead['purchase_meta_status'] = 'none';
    let metaError: string | undefined = undefined;
    let metaResponseId: string | undefined = undefined;

    if (saleData.sendToMeta && !targetLead.is_organic && targetLead.ctwa_clid) {
      const result = await MetaConversionsService.sendPurchase(
        targetLead,
        {
          amount: saleData.amount,
          currency: 'BRL',
          productName: saleData.productName,
          saleDate: saleData.saleDate,
        },
        metaIntegration
      );

      if (result.success) {
        metaStatus = 'sent';
        metaResponseId = result.responseId || result.fbtraceId;

        const newLog: MetaConversionLog = {
          id: `conv_${Date.now()}`,
          company_id: activeCompany.id,
          tenant_id: activeCompany.id,
          lead_id: targetLead.id,
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: result.eventId,
          action_source: 'chat',
          status: 'success',
          response_fbtrace_id: result.fbtraceId,
          payload: result.payload,
          response_data: result.responseData,
          created_at: new Date().toISOString(),
        };
        setMetaLogs((prev) => [newLog, ...prev]);

        updateTenantMetaConfig(activeCompany.id, {
          last_conversion_sent_at: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        metaStatus = 'failed';
        metaError = result.errorMessage || 'Falha ao despachar evento para Meta CAPI';
      }
    }

    setAllLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            stage_id: wonStage.id,
            sale_amount: saleData.amount,
            product_name: saleData.productName,
            sale_date: saleData.saleDate,
            sale_status: 'paid',
            purchase_sent: metaStatus === 'sent',
            purchase_sent_at: metaStatus === 'sent' ? new Date().toISOString() : undefined,
            purchase_meta_status: metaStatus,
            purchase_meta_error: metaError,
            purchase_response_id: metaResponseId,
            updated_at: new Date().toISOString(),
          };
        }
        return l;
      })
    );

    setDashboardMetrics((prev) => {
      const newRev = prev.revenueTotal + saleData.amount;
      const newConv = prev.conversionsCount + 1;
      return {
        ...prev,
        revenueTotal: newRev,
        conversionsCount: newConv,
        averageTicket: Number((newRev / newConv).toFixed(2)),
      };
    });

    closeSaleModal();
    return { success: metaStatus !== 'failed', error: metaError };
  };

  const retryConversion = async (leadId: string) => {
    const targetLead = allLeads.find((l) => l.id === leadId);
    if (!targetLead || targetLead.is_organic || !targetLead.ctwa_clid) return;

    const result = await MetaConversionsService.sendPurchase(
      targetLead,
      {
        amount: targetLead.sale_amount,
        currency: targetLead.currency || 'BRL',
        productName: targetLead.product_name,
        saleDate: targetLead.sale_date,
      },
      metaIntegration
    );

    if (result.success) {
      setAllLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                purchase_sent: true,
                purchase_sent_at: new Date().toISOString(),
                purchase_meta_status: 'sent',
                purchase_meta_error: undefined,
                purchase_response_id: result.responseId || result.fbtraceId,
              }
            : l
        )
      );

      const newLog: MetaConversionLog = {
        id: `conv_${Date.now()}`,
        company_id: activeCompany.id,
        tenant_id: activeCompany.id,
        lead_id: targetLead.id,
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: result.eventId,
        action_source: 'chat',
        status: 'success',
        response_fbtrace_id: result.fbtraceId,
        payload: result.payload,
        response_data: result.responseData,
        created_at: new Date().toISOString(),
      };
      setMetaLogs((prev) => [newLog, ...prev]);
    } else {
      setAllLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                purchase_meta_status: 'failed',
                purchase_meta_error: result.errorMessage,
              }
            : l
        )
      );
    }
  };

  const sendMessage = async (leadId: string, content: string) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      company_id: activeCompany.id,
      tenant_id: activeCompany.id,
      conversation_id: `conv_${leadId}`,
      lead_id: leadId,
      sender_type: 'agent',
      sender_id: currentUser.id,
      message_id: `out_${Date.now()}`,
      content,
      status: 'delivered',
      is_from_me: true,
      created_at: new Date().toISOString(),
    };

    setConversations((prev) => ({
      ...prev,
      [leadId]: [...(prev[leadId] || []), newMsg],
    }));

    setAllLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              last_interaction_at: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const updateLead = (leadId: string, partial: Partial<Lead>) => {
    setAllLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, ...partial, updated_at: new Date().toISOString() } : l))
    );
  };

  const addNewLead = async (leadData: Partial<Lead>): Promise<Lead> => {
    const firstStage = stages[0];
    const newId = `lead_${Date.now()}`;
    const isOrganic = leadData.is_organic || !leadData.ctwa_clid;

    const newLead: Lead = {
      id: newId,
      company_id: activeCompany.id,
      tenant_id: activeCompany.id,
      stage_id: leadData.stage_id || firstStage.id,
      assigned_to: currentUser.id,
      assigned_agent: currentUser,
      name: leadData.name || 'Novo Contato',
      phone: leadData.phone || '5511999999999',
      email: leadData.email,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
      tags: isOrganic ? [tags[3] || tags[0]] : [tags[0]],
      is_organic: isOrganic,
      ctwa_clid: leadData.ctwa_clid,
      source_id: leadData.source_id,
      platform: isOrganic ? 'organic' : leadData.platform || 'instagram',
      campaign_name: isOrganic ? undefined : leadData.campaign_name || 'Campanha WhatsApp 2026',
      ad_name: isOrganic ? undefined : leadData.ad_name || 'Criativo Principal',
      lead_submitted_sent: false,
      sale_amount: 0,
      currency: 'BRL',
      sale_status: 'none',
      purchase_sent: false,
      purchase_meta_status: 'none',
      first_message_at: new Date().toISOString(),
      last_interaction_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isOrganic && newLead.ctwa_clid) {
      const result = await MetaConversionsService.sendLeadSubmitted(newLead, metaIntegration);
      if (result.success) {
        newLead.lead_submitted_sent = true;
        newLead.lead_submitted_at = new Date().toISOString();
        newLead.lead_submitted_response_id = result.responseId || result.fbtraceId;

        const newLog: MetaConversionLog = {
          id: `conv_${Date.now()}`,
          company_id: activeCompany.id,
          tenant_id: activeCompany.id,
          lead_id: newLead.id,
          event_name: 'LeadSubmitted',
          event_time: Math.floor(Date.now() / 1000),
          event_id: result.eventId,
          action_source: 'chat',
          status: 'success',
          response_fbtrace_id: result.fbtraceId,
          payload: result.payload,
          response_data: result.responseData,
          created_at: new Date().toISOString(),
        };
        setMetaLogs((prev) => [newLog, ...prev]);
      }
    }

    setAllLeads((prev) => [newLead, ...prev]);

    setConversations((prev) => ({
      ...prev,
      [newId]: [
        {
          id: `msg_init_${Date.now()}`,
          company_id: activeCompany.id,
          tenant_id: activeCompany.id,
          conversation_id: `conv_${newId}`,
          lead_id: newId,
          sender_type: 'lead',
          message_id: `in_${Date.now()}`,
          content: isOrganic
            ? 'Olá! Gostaria de mais informações.'
            : 'Olá! Vi o anúncio no Instagram e gostaria de saber os detalhes!',
          status: 'delivered',
          is_from_me: false,
          created_at: new Date().toISOString(),
        },
      ],
    }));

    return newLead;
  };

  const updateWhatsAppStatus = (status: WhatsAppInstance['status']) => {
    updateTenantEvolutionConfig(activeCompany.id, { status });
  };

  const addStage = (name: string, color: string) => {
    const newStage: PipelineStage = {
      id: `stage_${Date.now()}`,
      company_id: activeCompany.id,
      tenant_id: activeCompany.id,
      pipeline_id: 'pipe_01',
      name,
      color,
      order_index: stages.length,
      is_won: false,
      is_lost: false,
      created_at: new Date().toISOString(),
    };
    setStages((prev) => [...prev, newStage]);
  };

  return (
    <CRMContext.Provider
      value={{
        environmentMode,
        setEnvironmentMode,
        companies,
        activeCompany,
        setActiveCompanyId,
        masterMetrics,
        createCompany,
        updateCompany,
        toggleCompanyStatus,
        deleteCompany,
        updateTenantEvolutionConfig,
        updateTenantMetaConfig,
        getAllWhatsAppInstances,
        getAllMetaIntegrations,
        clientIntegrationStatus,
        currentUser,
        setCurrentUserRole,
        setCurrentUserDirectly,
        allUsers,
        users,
        leads,
        stages,
        tags,
        whatsappInstance,
        metaIntegration,
        dashboardMetrics,
        conversations,
        metaLogs,
        selectedLead,
        isSaleModalOpen,
        pendingWonLead,
        setSelectedLead,
        openSaleModal,
        closeSaleModal,
        moveLeadStage,
        confirmSale,
        retryConversion,
        sendMessage,
        updateLead,
        addNewLead,
        updateWhatsAppStatus,
        addStage,
        syncWhatsAppLeads,
        isSyncingLeads,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
