import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedUserSession {
  role: string;
  tenantId: string | null;
  userId?: string;
}

/**
 * Validates request authentication and role in backend API routes.
 * Prevents clients from invoking admin endpoints directly.
 */
export function requireSuperAdmin(req: NextRequest): { errorResponse?: NextResponse; session?: AuthenticatedUserSession } {
  const role = req.cookies.get('rc_user_role')?.value || req.headers.get('x-user-role');
  const tenantId = req.cookies.get('rc_tenant_id')?.value || req.headers.get('x-tenant-id') || null;

  if (!role) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Não autenticado. Sessão expirada ou inexistente.' },
        { status: 401 }
      ),
    };
  }

  if (role !== 'super_admin' && role !== 'master_admin') {
    return {
      errorResponse: NextResponse.json(
        { error: '403 Forbidden: Apenas o Administrador Master possui permissão para esta rota.' },
        { status: 403 }
      ),
    };
  }

  return {
    session: {
      role,
      tenantId,
    },
  };
}

/**
 * Validates tenant access for client API routes.
 * Ensures clients can only access resources matching their own tenant_id.
 */
export function requireTenantAccess(req: NextRequest, targetTenantId: string): { errorResponse?: NextResponse; session?: AuthenticatedUserSession } {
  const role = req.cookies.get('rc_user_role')?.value || req.headers.get('x-user-role');
  const userTenantId = req.cookies.get('rc_tenant_id')?.value || req.headers.get('x-tenant-id') || null;

  if (!role) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      ),
    };
  }

  // Super admin has global tenant access
  if (role === 'super_admin' || role === 'master_admin') {
    return { session: { role, tenantId: userTenantId } };
  }

  // Client must match target tenant
  if (!userTenantId || userTenantId !== targetTenantId) {
    return {
      errorResponse: NextResponse.json(
        { error: '403 Forbidden: Acesso não autorizado a dados de outro tenant.' },
        { status: 403 }
      ),
    };
  }

  return { session: { role, tenantId: userTenantId } };
}
