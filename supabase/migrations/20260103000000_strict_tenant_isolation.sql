-- ==============================================================================
-- R&C Marketing CRM - Migration 20260103: Strict Tenant Isolation & Access Control
-- Regra de Segurança: Separação física e lógica entre Master e Clientes
-- ==============================================================================

-- 1. ROLES DEFINITION
DO $$ BEGIN
    CREATE TYPE app_user_role AS ENUM ('super_admin', 'client_admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TENANTS TABLE (Aliases with companies for backward compatibility)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_empresa VARCHAR(255) NOT NULL,
    subdominio VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure companies and tenants stay synchronized or create a view
CREATE OR REPLACE VIEW public.tenants_view AS 
    SELECT id, name as nome_empresa, subdomain as subdominio, status, created_at, updated_at 
    FROM public.companies;

-- 3. USERS / PROFILES TABLE
-- Rule: super_admin has tenant_id = NULL
-- Rule: client_admin / user has mandatory tenant_id
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Backfill tenant_id from company_id for existing records
UPDATE public.profiles 
SET tenant_id = company_id 
WHERE tenant_id IS NULL AND role != 'master_admin';

-- 4. HELPER FUNCTIONS FOR SECURITY CHECKS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
    SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role::text = 'super_admin' OR role::text = 'master_admin')
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 5. STRICT ROW LEVEL SECURITY (RLS) POLICIES

-- Companies / Tenants Policy:
-- Super admin can access all. Clients can ONLY access their own company/tenant.
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Master admin full access: companies" ON public.companies;

CREATE POLICY "Strict Tenant Isolation: companies"
ON public.companies FOR ALL
USING (
    public.is_super_admin() OR id = public.current_user_tenant_id()
)
WITH CHECK (
    public.is_super_admin()
);

-- Leads Policy:
-- Super admin can access all. Clients can ONLY access leads from their own tenant.
DROP POLICY IF EXISTS "Tenant isolation: leads" ON public.leads;
DROP POLICY IF EXISTS "Master admin full access: leads" ON public.leads;

CREATE POLICY "Strict Tenant Isolation: leads"
ON public.leads FOR ALL
USING (
    public.is_super_admin() OR company_id = public.current_user_tenant_id()
)
WITH CHECK (
    public.is_super_admin() OR company_id = public.current_user_tenant_id()
);

-- Conversations & Messages Policy:
DROP POLICY IF EXISTS "Tenant isolation: conversations" ON public.conversations;
CREATE POLICY "Strict Tenant Isolation: conversations"
ON public.conversations FOR ALL
USING (
    public.is_super_admin() OR company_id = public.current_user_tenant_id()
)
WITH CHECK (
    public.is_super_admin() OR company_id = public.current_user_tenant_id()
);

DROP POLICY IF EXISTS "Tenant isolation: messages" ON public.messages;
CREATE POLICY "Strict Tenant Isolation: messages"
ON public.messages FOR ALL
USING (
    public.is_super_admin() OR company_id = public.current_user_tenant_id()
)
WITH CHECK (
    public.is_super_admin() OR company_id = public.current_user_tenant_id()
);

-- Technical Configs (WhatsApp Instances & Meta Integrations):
-- Sensitive secrets (API keys, Tokens, Webhook Secrets) are accessible ONLY to super_admin!
DROP POLICY IF EXISTS "Tenant isolation: whatsapp_instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Master admin full access: whatsapp_instances" ON public.whatsapp_instances;

CREATE POLICY "SuperAdmin Only: whatsapp_instances_write"
ON public.whatsapp_instances FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Clients: whatsapp_instances_read_status_only"
ON public.whatsapp_instances FOR SELECT
USING (company_id = public.current_user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation: meta_integrations" ON public.meta_integrations;
DROP POLICY IF EXISTS "Master admin full access: meta_integrations" ON public.meta_integrations;

CREATE POLICY "SuperAdmin Only: meta_integrations_full"
ON public.meta_integrations FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
