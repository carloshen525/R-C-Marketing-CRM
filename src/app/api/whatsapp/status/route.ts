import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { instanceName, apiUrl, apiKey } = body;

    const baseUrl = (apiUrl || process.env.EVOLUTION_API_URL || 'https://prospeccao-evolution01.pesd8y.easypanel.host').replace(/\/+$/, '');
    const key = apiKey || process.env.EVOLUTION_API_KEY || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD';

    let targetInstance = (instanceName || '').trim();
    if (!targetInstance) {
      return NextResponse.json({ connected: false, state: 'disconnected' });
    }
    const cleanInstance = encodeURIComponent(targetInstance);

    const stateRes = await fetch(`${baseUrl}/instance/connectionState/${cleanInstance}`, {
      headers: { apikey: key },
      cache: 'no-store',
    });

    if (!stateRes.ok) {
      return NextResponse.json({ connected: false, state: 'disconnected' });
    }

    const stateData = await stateRes.json();
    const state = stateData?.instance?.state || stateData?.state || 'disconnected';
    const isConnected = state === 'open';

    return NextResponse.json({
      connected: isConnected,
      state,
      instanceName: targetInstance,
    });
  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error?.message || 'Erro' });
  }
}
