export type UserRole =
  | 'super_admin' // Master Admin R&C (tenant_id = null)
  | 'client_admin' // Administrador do Cliente (tenant_id obrigatório)
  | 'user' // Usuário / Atendente do Cliente (tenant_id obrigatório)
  // Legacy aliases
  | 'master_admin'
  | 'admin'
  | 'manager'
  | 'agent';

export type SaaSPlan = 'starter' | 'pro' | 'enterprise';

export type CompanyStatus = 'active' | 'suspended' | 'pending';

export interface Company {
  id: string; // tenant_id
  tenant_id?: string;
  name: string;
  nome_empresa?: string;
  trade_name?: string; // Nome fantasia
  slug: string;
  subdomain: string; // Ex: 'terraesilva'
  subdominio?: string;
  full_subdomain: string; // Ex: 'terraesilva.rcmarketingcrm.com.br'
  document?: string; // CNPJ / CPF
  owner_name: string; // Responsável
  email: string;
  phone: string; // WhatsApp
  plan: SaaSPlan;
  monthly_price?: number; // Valor mensal personalizado em R$
  status: CompanyStatus;
  logo_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null; // NULL for super_admin, mandatory UUID for clients
  company_id: string | null; // NULL for super_admin, company UUID for clients
  name?: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  must_change_password?: boolean;
  temporary_password?: string;
  created_at: string;
  updated_at: string;
}

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'failed';

export interface WhatsAppInstance {
  id: string;
  company_id: string;
  tenant_id?: string;
  instance_name: string;
  api_url: string; // Master only
  api_key: string; // Master only
  status: WhatsAppStatus;
  qrcode_base64?: string;
  phone_number?: string;
  profile_name?: string;
  profile_picture_url?: string;
  webhook_url?: string;
  last_sync_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetaIntegration {
  id: string;
  company_id: string;
  tenant_id?: string;
  pixel_id: string; // Master only
  access_token: string; // Master only (Permanent Graph API token)
  page_id?: string; // Master only
  dataset_id?: string; // Master only
  webhook_secret?: string; // Master only
  graph_api_version?: string; // Master only (e.g. 'v20.0')
  test_event_code?: string; // Master only
  is_active: boolean;
  last_conversion_sent_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Client-safe integration status view model
 * The client NEVER sees tokens, keys, pixel IDs or raw URLs!
 */
export interface ClientIntegrationStatus {
  whatsapp: {
    isConnected: boolean;
    statusText: 'Online' | 'Aguardando QR Code' | 'Desconectado';
    phoneNumber?: string;
    lastSyncAt: string;
    instanceName: string;
  };
  metaAds: {
    isConnected: boolean;
    statusText: 'Conectado' | 'Pendente' | 'Desconectado';
    trackingActive: boolean;
    lastConversionSentAt?: string;
    leadsTrackedCount: number;
    purchasesSentCount: number;
  };
}

export interface Pipeline {
  id: string;
  company_id: string;
  tenant_id?: string;
  name: string;
  is_default: boolean;
  stages?: PipelineStage[];
  created_at: string;
}

export interface PipelineStage {
  id: string;
  company_id: string;
  tenant_id?: string;
  pipeline_id: string;
  name: string;
  color: string;
  order_index: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  company_id: string;
  tenant_id?: string;
  name: string;
  color: string;
  created_at?: string;
}

export type MetaSyncStatus = 'none' | 'pending' | 'sent' | 'failed';

export interface Lead {
  id: string;
  company_id: string;
  tenant_id?: string;
  stage_id: string;
  assigned_to?: string;
  assigned_agent?: Profile;
  
  // Lead Info
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  tags?: Tag[];

  // Meta Click-to-WhatsApp (CTWA) Tracking fields
  is_organic: boolean;
  ctwa_clid?: string;
  source_id?: string;
  platform?: string; // 'facebook' | 'instagram' | 'organic'
  lid?: string;
  
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  pixel_id?: string;
  page_id?: string;
  
  // LeadSubmitted CAPI Event
  lead_submitted_sent: boolean;
  lead_submitted_at?: string;
  lead_submitted_response_id?: string;

  // Sale fields
  product_name?: string;
  sale_amount: number;
  currency: string;
  sale_date?: string;
  sale_status: 'none' | 'pending' | 'paid' | 'cancelled';
  
  // Purchase CAPI Event
  purchase_sent: boolean;
  purchase_sent_at?: string;
  purchase_meta_status: MetaSyncStatus;
  purchase_meta_error?: string;
  purchase_response_id?: string;

  first_message_at: string;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  company_id: string;
  tenant_id?: string;
  lead_id: string;
  whatsapp_instance_id?: string;
  remote_jid: string;
  unread_count: number;
  last_message?: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  company_id: string;
  tenant_id?: string;
  conversation_id: string;
  lead_id: string;
  sender_type: 'lead' | 'agent' | 'system';
  sender_id?: string;
  message_id: string;
  content: string;
  media_type?: 'text' | 'image' | 'audio' | 'video' | 'document';
  media_url?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  is_from_me: boolean;
  raw_payload?: Record<string, unknown>;
  created_at: string;
}

export interface MetaConversionLog {
  id: string;
  company_id: string;
  tenant_id?: string;
  lead_id: string;
  event_name: 'LeadSubmitted' | 'Purchase';
  event_time: number;
  event_id: string;
  action_source: string;
  status: 'success' | 'failed';
  response_fbtrace_id?: string;
  error_message?: string;
  payload: Record<string, unknown>;
  response_data?: Record<string, unknown>;
  created_at: string;
}

export interface LeadNote {
  id: string;
  company_id: string;
  tenant_id?: string;
  lead_id: string;
  author_id?: string;
  author_name?: string;
  content: string;
  created_at: string;
}

export interface LeadTask {
  id: string;
  company_id: string;
  tenant_id?: string;
  lead_id: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface DashboardMetrics {
  leadsToday: number;
  leadsMonth: number;
  conversionsCount: number;
  revenueTotal: number;
  averageTicket: number;
  conversionRate: number;
  estimatedROI: number;
  leadsByDay: { date: string; leads: number; sales: number }[];
  salesByDay: { date: string; revenue: number }[];
  topCampaigns: { id: string; name: string; leads: number; sales: number; revenue: number; conversionRate: number }[];
  topAds: { id: string; name: string; campaign: string; revenue: number; sales: number }[];
}

export interface MasterSaaSMetrics {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  mrrTotal: number;
  totalLeadsTracked: number;
  totalSalesRecorded: number;
  totalRevenueGenerated: number;
  totalCapiEventsSent: number;
  evolutionInstancesOnline: number;
  evolutionInstancesTotal: number;
}
