import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { instanceName, apiUrl, apiKey } = await req.json();

    const baseUrl = (apiUrl || process.env.EVOLUTION_API_URL || 'https://prospeccao-evolution01.pesd8y.easypanel.host').replace(/\/+$/, '');
    const key = apiKey || process.env.EVOLUTION_API_KEY || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD';
    const targetInstance = instanceName || 'Carlos1';

    // 1. First, check connection state
    try {
      const stateRes = await fetch(`${baseUrl}/instance/connectionState/${targetInstance}`, {
        headers: { apikey: key },
        cache: 'no-store',
      });

      if (stateRes.ok) {
        const stateData = await stateRes.json();
        const state = stateData?.instance?.state || stateData?.state;
        if (state === 'open') {
          return NextResponse.json({
            connected: true,
            status: 'connected',
            message: 'Instância já está conectada!',
          });
        }
      }
    } catch (e) {
      console.warn('Failed to check connection state, proceeding to connect:', e);
    }

    // 2. Request QR code connection
    const connectRes = await fetch(`${baseUrl}/instance/connect/${targetInstance}`, {
      headers: { apikey: key },
      cache: 'no-store',
    });

    if (!connectRes.ok) {
      // If 404, maybe instance doesn't exist, try creating it
      if (connectRes.status === 404) {
        const createRes = await fetch(`${baseUrl}/instance/create`, {
          method: 'POST',
          headers: {
            apikey: key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: targetInstance,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });

        if (createRes.ok) {
          const createData = await createRes.json();
          const base64 = createData?.qrcode?.base64 || createData?.base64;
          return NextResponse.json({
            connected: false,
            status: 'qrcode',
            qrcode: base64,
            pairingCode: createData?.qrcode?.pairingCode || null,
          });
        }
      }

      const errorText = await connectRes.text();
      return NextResponse.json(
        { error: `Erro na Evolution API: ${errorText}` },
        { status: connectRes.status }
      );
    }

    const data = await connectRes.json();
    const base64 = data?.base64 || data?.qrcode?.base64;

    return NextResponse.json({
      connected: data?.instance?.state === 'open',
      status: data?.base64 ? 'qrcode' : 'connected',
      qrcode: base64,
      pairingCode: data?.pairingCode || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao conectar com o WhatsApp' },
      { status: 500 }
    );
  }
}
