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
} from './types';

const T_NOW = new Date().toISOString();

/**
 * Clean Initial Production State:
 * Starts exclusively with Carlos Henrique as Super Admin (Master Owner)
 * No fictitious companies, no fake leads, no fake WhatsApp conversations.
 */

export const initialProfiles: Profile[] = [
  // Master Super Admin (R&C Marketing Owner)
  {
    id: 'user_master_carlos',
    tenant_id: null,
    company_id: null,
    full_name: 'Carlos Henrique (Master)',
    email: 'carloshenrq1245@gmail.com',
    role: 'super_admin',
    is_active: true,
    phone: '+55 62 8200-2147',
    created_at: T_NOW,
    updated_at: T_NOW,
  },
  // Client Admin Account - Amadeus Instituto de Artes
  {
    id: 'user_amadeus_admin',
    tenant_id: 'comp_amadeus',
    company_id: 'comp_amadeus',
    full_name: 'Carlos Henrique (Amadeus)',
    email: 'caliocarloshenrique14@gmail.com',
    role: 'client_admin',
    is_active: true,
    phone: '+55 62 8200-2147',
    created_at: T_NOW,
    updated_at: T_NOW,
  },
];

export const initialCompanies: Company[] = [
  {
    id: 'comp_amadeus',
    tenant_id: 'comp_amadeus',
    name: 'Amadeus Instituto de Artes',
    nome_empresa: 'Amadeus Instituto de Artes',
    trade_name: 'Amadeus Instituto de Artes',
    slug: 'amadeus',
    subdomain: 'amadeus',
    subdominio: 'amadeus',
    full_subdomain: 'amadeus.carloscalio.tech',
    owner_name: 'Carlos Henrique',
    email: 'caliocarloshenrique14@gmail.com',
    phone: '+55 62 8200-2147',
    plan: 'pro',
    monthly_price: 890,
    status: 'active',
    timezone: 'America/Sao_Paulo',
    created_at: T_NOW,
    updated_at: T_NOW,
  },
  {
    id: 'comp_pedagogicos',
    tenant_id: 'comp_pedagogicos',
    name: 'Pedagógicos EU',
    nome_empresa: 'Pedagógicos EU',
    trade_name: 'Projeto Saber Mais',
    slug: 'pedagogicoseu',
    subdomain: 'pedagogicoseu',
    subdominio: 'pedagogicoseu',
    full_subdomain: 'pedagogicoseu.carloscalio.tech',
    owner_name: 'Carlos Henrique',
    email: 'carloshenrq1245@gmail.com',
    phone: '+55 62 8200-2147',
    plan: 'pro',
    monthly_price: 890,
    status: 'active',
    timezone: 'America/Sao_Paulo',
    created_at: T_NOW,
    updated_at: T_NOW,
  },
];

export const initialWhatsAppInstances: Record<string, WhatsAppInstance> = {
  comp_pedagogicos: {
    id: 'inst_carlos1',
    company_id: 'comp_pedagogicos',
    tenant_id: 'comp_pedagogicos',
    instance_name: 'Carlos1',
    api_url: 'https://prospeccao-evolution01.pesd8y.easypanel.host',
    api_key: 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD',
    phone_number: '556282002147',
    status: 'connected',
    is_active: true,
    webhook_url: 'https://crm.carloscalio.tech/api/webhooks/evolution?company_id=comp_pedagogicos',
    created_at: T_NOW,
    updated_at: T_NOW,
  },
  comp_amadeus: {
    id: 'inst_amadeus',
    company_id: 'comp_amadeus',
    tenant_id: 'comp_amadeus',
    instance_name: 'amadeusinstitutodeartes',
    api_url: 'https://prospeccao-evolution01.pesd8y.easypanel.host',
    api_key: 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD',
    phone_number: '551933666484',
    status: 'connected',
    is_active: true,
    webhook_url: 'https://crm.carloscalio.tech/api/webhooks/evolution?company_id=comp_amadeus',
    created_at: T_NOW,
    updated_at: T_NOW,
  },
};

export const initialMetaIntegrations: Record<string, MetaIntegration> = {
  comp_pedagogicos: {
    id: 'meta_pedagogicos',
    company_id: 'comp_pedagogicos',
    tenant_id: 'comp_pedagogicos',
    pixel_id: '1838816967308658',
    access_token:
      'EAAjy7fZAjxjsBSVev7bxevLHPjUA4yhuuy9Hepi1XFjIu1R9OslsXMy1XKf53UdyCh4KiHQbKwGY8eeM9WVh11NY4FNP1ZBZABq0TKzamF6nbaejveNqPBD7ss8DLoawVZAoUaBKVMOqwa3EjsU6jr9O2G94MRXXan8iVpIxusvFZCZBdzSR0rYci3W73OtjFufwZDZD',
    page_id: '560563063815546',
    is_active: true,
    created_at: T_NOW,
    updated_at: T_NOW,
  },
  comp_amadeus: {
    id: 'meta_amadeus',
    company_id: 'comp_amadeus',
    tenant_id: 'comp_amadeus',
    pixel_id: '2041232726494699',
    access_token: '',
    page_id: '551732564683424',
    graph_api_version: 'v25.0',
    last_conversion_sent_at: 'Nenhuma conversão enviada',
    is_active: false,
    created_at: T_NOW,
    updated_at: T_NOW,
  },
};

export const defaultPipelineStages: PipelineStage[] = [
  { id: 'stage_1', company_id: '', pipeline_id: 'default', name: 'Novos Leads', color: '#3b82f6', order_index: 1, is_won: false, is_lost: false, created_at: T_NOW },
  { id: 'stage_5', company_id: '', pipeline_id: 'default', name: 'Venda Concluída', color: '#10b981', order_index: 2, is_won: true, is_lost: false, created_at: T_NOW },
];

export const defaultTags: Tag[] = [
  { id: 'tag_1', company_id: '', name: 'Meta CTWA', color: '#3b82f6', created_at: T_NOW },
  { id: 'tag_2', company_id: '', name: 'Quente', color: '#ef4444', created_at: T_NOW },
  { id: 'tag_3', company_id: '', name: 'Orçamento Enviado', color: '#8b5cf6', created_at: T_NOW },
  { id: 'tag_4', company_id: '', name: 'Orgânico', color: '#10b981', created_at: T_NOW },
];

export const initialLeads: Lead[] = [];

export const initialConversations: Record<string, Message[]> = {};

export const initialMetaLogs: MetaConversionLog[] = [];

export const initialDashboardMetrics: DashboardMetrics = {
  leadsToday: 0,
  leadsMonth: 0,
  conversionsCount: 0,
  revenueTotal: 0,
  averageTicket: 0,
  conversionRate: 0,
  estimatedROI: 0,
  leadsByDay: [],
  salesByDay: [],
  topCampaigns: [],
  topAds: [],
};

export const initialMasterSaaSMetrics: MasterSaaSMetrics = {
  totalCompanies: 0,
  activeCompanies: 0,
  suspendedCompanies: 0,
  mrrTotal: 0,
  totalLeadsTracked: 0,
  totalSalesRecorded: 0,
  totalRevenueGenerated: 0,
  totalCapiEventsSent: 0,
  evolutionInstancesOnline: 0,
  evolutionInstancesTotal: 0,
};
