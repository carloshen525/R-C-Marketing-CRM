import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-guard';

export async function GET(req: NextRequest) {
  const guard = requireSuperAdmin(req);
  if (guard.errorResponse) {
    return guard.errorResponse;
  }

  // Returns tenant management data exclusively for super_admin
  return NextResponse.json({
    status: 'ok',
    message: 'Área administrativa de empresas protegida',
  });
}

export async function POST(req: NextRequest) {
  const guard = requireSuperAdmin(req);
  if (guard.errorResponse) {
    return guard.errorResponse;
  }

  return NextResponse.json({
    status: 'created',
  });
}
