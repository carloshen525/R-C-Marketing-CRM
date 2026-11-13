-- ==============================================================================
-- R&C Marketing CRM - Migration 20260104: Master Admin Seed & Authentication Rules
-- Usuário inicial: Carlos (admin@rcmarketingcrm.com), role: super_admin, tenant_id: NULL
-- ==============================================================================

-- 1. Inserir ou atualizar na tabela auth.users se a extensão pgcrypto estiver ativa
-- Para instâncias Supabase rodando localmente ou no Cloud:
DO $$
DECLARE
    master_user_id UUID := '00000000-0000-0000-0000-000000000001';
    master_email TEXT := 'carloshenrq1245@gmail.com';
BEGIN
    -- Garante que se o usuário já existir no auth.users, atualizamos
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = master_email) THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            master_user_id,
            '00000000-0000-0000-0000-000000000000',
            master_email,
            crypt('12277891', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"],"role":"super_admin"}',
            '{"full_name":"Carlos Henrique","role":"super_admin"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    END IF;

    -- 2. Inserir / Atualizar na tabela public.profiles
    INSERT INTO public.profiles (
        id,
        tenant_id,
        company_id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        master_user_id,
        NULL, -- Regra: super_admin possui tenant_id = NULL
        NULL,
        'Carlos Henrique',
        master_email,
        'super_admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'super_admin',
        tenant_id = NULL,
        full_name = 'Carlos Henrique',
        email = master_email,
        updated_at = NOW();

END $$;

-- 3. Trigger de Segurança para prevenir criação não-autorizada de super_admin
CREATE OR REPLACE FUNCTION public.check_super_admin_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o novo perfil tiver role = 'super_admin', verificar se quem está criando é super_admin
    IF NEW.role = 'super_admin' THEN
        IF auth.uid() IS NOT NULL THEN
            IF NOT public.is_super_admin() THEN
                RAISE EXCEPTION 'Apenas usuários super_admin podem criar ou promover contas para super_admin';
            END IF;
        END IF;
    END IF;

    -- Usuários super_admin não podem pertencer a um tenant específico
    IF NEW.role = 'super_admin' THEN
        NEW.tenant_id := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_super_admin ON public.profiles;
CREATE TRIGGER tr_check_super_admin
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_super_admin_creation();
