import { NextRequest, NextResponse } from 'next/server';
import { getStoredUsers, saveUser } from '@/lib/server/users-storage';

export async function GET() {
  try {
    const users = getStoredUsers();
    // Return sanitized users list
    return NextResponse.json({
      status: 'ok',
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        company_id: u.company_id,
        tenant_id: u.tenant_id,
        is_active: u.is_active,
      })),
      total: users.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }
    const saved = saveUser(body);
    return NextResponse.json({ status: 'saved', user: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao salvar usuário' }, { status: 500 });
  }
}
