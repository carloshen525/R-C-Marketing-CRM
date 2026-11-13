-- ==============================================================================
-- R&C Marketing CRM - Migration 20260102: Master Admin & Multi-Tenant SaaS
-- Painel Master (R&C Marketing) + Painel do Cliente (Subdomínios)
-- ==============================================================================

-- 1. ADD MASTER_ADMIN ROLE
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'master_admin';

-- 2. COMPANY PLANS & STATUS ENUMS
CREATE TYPE saas_plan AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE company_status AS ENUM ('active', 'suspended', 'pending');

-- 3. EXPAND COMPANIES TABLE FOR SAAS MULTI-TENANCY & SUBDOMAINS
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255) DEFAULT 'Responsável',
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS plan saas_plan DEFAULT 'pro',
    ADD COLUMN IF NOT EXISTS status company_status DEFAULT 'active';

-- 4. EXPAND META INTEGRATIONS WITH ADVANCED TECHNICAL SETTINGS (MASTER ONLY)
ALTER TABLE public.meta_integrations
    ADD COLUMN IF NOT EXISTS dataset_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
    ADD COLUMN IF NOT EXISTS graph_api_version VARCHAR(20) DEFAULT 'v20.0',
    ADD COLUMN IF NOT EXISTS last_conversion_sent_at TIMESTAMPTZ;

-- 5. EXPAND WHATSAPP INSTANCES (MASTER ONLY TECHNICAL SETTINGS)
ALTER TABLE public.whatsapp_instances
    ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ DEFAULT NOW();

-- 6. PROFILES TEMP PASSWORD & FIRST LOGIN
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS temporary_password VARCHAR(255);

-- 7. MASTER ADMIN POLICIES (Superadmin can manage all companies and integrations)
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'master_admin'
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Master Admin full access policy across all tables
CREATE POLICY "Master admin full access: companies"
ON public.companies FOR ALL
USING (public.is_master_admin())
WITH CHECK (public.is_master_admin());

CREATE POLICY "Master admin full access: meta_integrations"
ON public.meta_integrations FOR ALL
USING (public.is_master_admin())
WITH CHECK (public.is_master_admin());

CREATE POLICY "Master admin full access: whatsapp_instances"
ON public.whatsapp_instances FOR ALL
USING (public.is_master_admin())
WITH CHECK (public.is_master_admin());

CREATE POLICY "Master admin full access: leads"
ON public.leads FOR ALL
USING (public.is_master_admin())
WITH CHECK (public.is_master_admin());

CREATE POLICY "Master admin full access: profiles"
ON public.profiles FOR ALL
USING (public.is_master_admin())
WITH CHECK (public.is_master_admin());
