-- ==============================================================================
-- R&C Marketing CRM - Complete Multi-Tenant Database Schema with RLS
-- Meta Ads (CTWA) + WhatsApp (Evolution API) + CRM + Conversions API (CAPI)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TENANTS / COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    document VARCHAR(30), -- CNPJ / CPF
    logo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (Extends Supabase auth.users)
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'agent',
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WHATSAPP INSTANCES (Multi-Tenant Evolution API Integration)
CREATE TYPE whatsapp_status AS ENUM ('disconnected', 'connecting', 'qrcode', 'connected', 'failed');

CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    instance_name VARCHAR(100) NOT NULL UNIQUE,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    status whatsapp_status DEFAULT 'disconnected',
    qrcode_base64 TEXT,
    phone_number VARCHAR(30),
    profile_name VARCHAR(255),
    profile_picture_url TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. META INTEGRATIONS (Pixel + Conversions API Token per Company)
CREATE TABLE IF NOT EXISTS public.meta_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    pixel_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    page_id VARCHAR(100),
    test_event_code VARCHAR(100), -- For testing events in Meta Events Manager
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PIPELINES & STAGES (CRM Funnel)
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Funil de Vendas',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    order_index INT NOT NULL DEFAULT 0,
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TAGS
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LEADS (With Full CTWA Meta Tracking & Sales Fields)
CREATE TYPE meta_sync_status AS ENUM ('none', 'pending', 'sent', 'failed');

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Lead basic info
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    
    -- Meta Click-to-WhatsApp (CTWA) Tracking fields
    is_organic BOOLEAN DEFAULT FALSE,
    ctwa_clid VARCHAR(255),
    source_id VARCHAR(255),
    platform VARCHAR(50) DEFAULT 'whatsapp', -- facebook / instagram / organic
    lid VARCHAR(100),
    
    campaign_id VARCHAR(100),
    campaign_name VARCHAR(255),
    adset_id VARCHAR(100),
    adset_name VARCHAR(255),
    ad_id VARCHAR(100),
    ad_name VARCHAR(255),
    pixel_id VARCHAR(100),
    page_id VARCHAR(100),
    
    -- Automatic LeadSubmitted tracking
    lead_submitted_sent BOOLEAN DEFAULT FALSE,
    lead_submitted_at TIMESTAMPTZ,
    lead_submitted_response_id VARCHAR(255),
    
    -- Sale / Conversion fields
    product_name VARCHAR(255),
    sale_amount NUMERIC(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'BRL',
    sale_date TIMESTAMPTZ,
    sale_status VARCHAR(50) DEFAULT 'none', -- none, pending, paid, cancelled
    
    -- Purchase Conversions API tracking
    purchase_sent BOOLEAN DEFAULT FALSE,
    purchase_sent_at TIMESTAMPTZ,
    purchase_meta_status meta_sync_status DEFAULT 'none',
    purchase_meta_error TEXT,
    purchase_response_id VARCHAR(255),

    -- Activity & Timestamps
    first_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LEAD TAGS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.lead_tags (
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, tag_id)
);

-- 10. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
    remote_jid VARCHAR(100) NOT NULL,
    unread_count INT DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'lead', 'agent', 'system'
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_id VARCHAR(255) NOT NULL,
    content TEXT,
    media_type VARCHAR(50) DEFAULT 'text',
    media_url TEXT,
    status VARCHAR(30) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    is_from_me BOOLEAN DEFAULT FALSE,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. META CONVERSIONS LOG (Audit trail of every CAPI request)
CREATE TABLE IF NOT EXISTS public.meta_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    event_name VARCHAR(50) NOT NULL, -- 'LeadSubmitted', 'Purchase'
    event_time BIGINT NOT NULL,
    event_id VARCHAR(255) NOT NULL UNIQUE, -- Meta deduplication ID
    action_source VARCHAR(50) DEFAULT 'chat',
    status VARCHAR(20) NOT NULL, -- 'success', 'failed'
    response_fbtrace_id VARCHAR(255),
    error_message TEXT,
    payload JSONB NOT NULL,
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTES & TASKS
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Companies: Users can only read their own company
CREATE POLICY "Users can view own company" 
ON public.companies FOR SELECT 
USING (id = public.get_auth_company_id());

-- Profiles: Users can view coworkers in same company
CREATE POLICY "Users can view team profiles" 
ON public.profiles FOR SELECT 
USING (company_id = public.get_auth_company_id());

-- Generic company isolation for all multi-tenant tables
CREATE POLICY "Tenant isolation: whatsapp_instances" 
ON public.whatsapp_instances FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: meta_integrations" 
ON public.meta_integrations FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: pipelines" 
ON public.pipelines FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: pipeline_stages" 
ON public.pipeline_stages FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: tags" 
ON public.tags FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: leads" 
ON public.leads FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: conversations" 
ON public.conversations FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: messages" 
ON public.messages FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: meta_conversions" 
ON public.meta_conversions FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: lead_notes" 
ON public.lead_notes FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation: lead_tasks" 
ON public.lead_tasks FOR ALL 
USING (company_id = public.get_auth_company_id())
WITH CHECK (company_id = public.get_auth_company_id());

-- ==============================================================================
-- DEFAULT SEED DATA (For New Company Registration Trigger)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_company_setup(new_company_id UUID)
RETURNS VOID AS $$
DECLARE
    new_pipeline_id UUID;
BEGIN
    -- Create Default Pipeline
    INSERT INTO public.pipelines (company_id, name, is_default)
    VALUES (new_company_id, 'Funil Comercial', TRUE)
    RETURNING id INTO new_pipeline_id;

    -- Create Default Stages
    INSERT INTO public.pipeline_stages (company_id, pipeline_id, name, color, order_index, is_won, is_lost)
    VALUES
        (new_company_id, new_pipeline_id, 'Novos Leads', '#3B82F6', 0, FALSE, FALSE),
        (new_company_id, new_pipeline_id, 'Em Atendimento', '#F59E0B', 1, FALSE, FALSE),
        (new_company_id, new_pipeline_id, 'Negociação', '#8B5CF6', 2, FALSE, FALSE),
        (new_company_id, new_pipeline_id, 'Aguardando Pagamento', '#EC4899', 3, FALSE, FALSE),
        (new_company_id, new_pipeline_id, 'Venda Concluída', '#10B981', 4, TRUE, FALSE),
        (new_company_id, new_pipeline_id, 'Perdido', '#EF4444', 5, FALSE, TRUE);

    -- Create Default Tags
    INSERT INTO public.tags (company_id, name, color)
    VALUES
        (new_company_id, 'Meta Ads', '#2563EB'),
        (new_company_id, 'Quente', '#DC2626'),
        (new_company_id, 'VIP', '#D97706'),
        (new_company_id, 'Retorno', '#059669');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
