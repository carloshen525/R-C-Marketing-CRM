import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { role, tenantId } = await req.json();

    const response = NextResponse.json({ success: true, role, tenantId });

    // Set cookie for middleware validation (1 day expiry)
    response.cookies.set('rc_user_role', role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    if (tenantId) {
      response.cookies.set('rc_tenant_id', tenantId, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });
    } else {
      response.cookies.delete('rc_tenant_id');
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao definir sessão de autenticação' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logout realizado' });
  response.cookies.delete('rc_user_role');
  response.cookies.delete('rc_tenant_id');
  return response;
}
