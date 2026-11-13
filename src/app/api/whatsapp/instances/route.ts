import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const baseUrl = (process.env.EVOLUTION_API_URL || 'https://prospeccao-evolution01.pesd8y.easypanel.host').replace(/\/+$/, '');
    const key = process.env.EVOLUTION_API_KEY || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD';

    const res = await fetch(`${baseUrl}/instance/fetchInstances`, {
      headers: { apikey: key },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao listar instâncias da Evolution API' }, { status: res.status });
    }

    const data = await res.json();
    const instances = Array.isArray(data) ? data : data?.value || [];

    const formatted = instances.map((inst: any) => ({
      id: inst.id,
      name: inst.name,
      connectionStatus: inst.connectionStatus,
      ownerJid: inst.ownerJid,
      profileName: inst.profileName,
      profilePicUrl: inst.profilePicUrl,
      integration: inst.integration,
      createdAt: inst.createdAt,
    }));

    return NextResponse.json({ instances: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Falha ao buscar instâncias' }, { status: 500 });
  }
}
