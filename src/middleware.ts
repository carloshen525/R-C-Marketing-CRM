import { NextRequest, NextResponse } from 'next/server';

/**
 * Global Multi-Tenant & Security Protection Middleware
 * Enforces strict boundary between Master Admin and Tenant Clients
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  // Extract subdomain if on custom domain
  // e.g. terraesilva.rcmarketingcrm.com.br or admin.rcmarketingcrm.com.br
  let currentSubdomain: string | null = null;
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  if (!isLocalhost && hostname.includes('.rcmarketingcrm.com.br')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      currentSubdomain = parts[0].toLowerCase();
    }
  }

  // Check role from session cookie if present
  const userRole = req.cookies.get('rc_user_role')?.value || req.headers.get('x-user-role');
  const userTenantId = req.cookies.get('rc_tenant_id')?.value;

  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/master') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/settings/global');

  // Rule 1: Master Admin domain access
  const isMasterDomain = currentSubdomain === 'admin';

  // Rule 2: If accessing admin route:
  // - If not logged in at all, redirect to /login
  // - If logged in as client (non-superadmin), redirect to /acesso-negado (403)
  if (isAdminRoute) {
    if (!userRole) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'super_admin' && userRole !== 'master_admin') {
      const deniedUrl = new URL('/acesso-negado', req.url);
      return NextResponse.redirect(deniedUrl);
    }
  }

  // Rule 3: If on client subdomain, block access to any admin routes and ensure tenant isolation
  if (currentSubdomain && currentSubdomain !== 'admin' && currentSubdomain !== 'app') {
    if (isAdminRoute) {
      const clientDashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(clientDashboardUrl);
    }
  }

  // Rule 4: If on admin subdomain and accessing client root, route to /admin/dashboard
  if (isMasterDomain && pathname === '/') {
    const adminUrl = new URL('/admin/dashboard', req.url);
    return NextResponse.redirect(adminUrl);
  }

  // Clone headers and inject tenant/subdomain metadata
  const requestHeaders = new Headers(req.headers);
  if (currentSubdomain) {
    requestHeaders.set('x-tenant-subdomain', currentSubdomain);
  }
  if (userTenantId) {
    requestHeaders.set('x-tenant-id', userTenantId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
