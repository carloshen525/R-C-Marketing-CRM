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
    pathname.startsWith('/super-admin');

  // Rule 1: Master Admin domain access
  const isMasterDomain = currentSubdomain === 'admin';

  // Rule 2: If client user tries to access /admin or /master, BLOCK immediately
  if (isAdminRoute) {
    if (userRole && userRole !== 'super_admin' && userRole !== 'master_admin') {
      const deniedUrl = new URL('/acesso-negado', req.url);
      return NextResponse.redirect(deniedUrl);
    }
  }

  // Rule 3: If on admin subdomain and accessing client root, route to /admin
  if (isMasterDomain && pathname === '/') {
    const adminUrl = new URL('/admin', req.url);
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
