import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { instanceName, apiUrl, apiKey, companyId } = body;

    const baseUrl = (apiUrl || process.env.EVOLUTION_API_URL || 'https://prospeccao-evolution01.pesd8y.easypanel.host').replace(/\/+$/, '');
    const key = apiKey || process.env.EVOLUTION_API_KEY || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD';

    // Clean instance name, remove invalid characters
    let targetInstance = (instanceName || '').trim();
    if (!targetInstance) {
      targetInstance = 'empresa_crm';
    }
    const cleanInstance = encodeURIComponent(targetInstance);
    const baseWebhookUrl =
      process.env.EVOLUTION_WEBHOOK_URL ||
      'https://crm.carloscalio.tech/api/webhooks/evolution';
    const webhookUrl = companyId
      ? `${baseWebhookUrl}${baseWebhookUrl.includes('?') ? '&' : '?'}company_id=${encodeURIComponent(companyId)}`
      : baseWebhookUrl;

    const configureWebhook = async () => {
      try {
        const webhookRes = await fetch(`${baseUrl}/webhook/set/${cleanInstance}`, {
          method: 'POST',
          headers: {
            apikey: key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              byEvents: false,
              base64: false,
              webhookByEvents: false,
              webhookBase64: false,
              events: [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
              ],
            },
          }),
        });
        if (!webhookRes.ok) {
          console.warn(
            '[WhatsApp Connect] Evolution rejected webhook configuration:',
            await webhookRes.text()
          );
        }
      } catch (error) {
        console.warn('[WhatsApp Connect] Failed to configure Evolution webhook:', error);
      }
    };

    // 1. First, check connection state
    try {
      const stateRes = await fetch(`${baseUrl}/instance/connectionState/${cleanInstance}`, {
        headers: { apikey: key },
        cache: 'no-store',
      });

      if (stateRes.ok) {
        const stateData = await stateRes.json();
        const state = stateData?.instance?.state || stateData?.state;
        if (state === 'open') {
          await configureWebhook();
          return NextResponse.json({
            connected: true,
            status: 'connected',
            message: 'Instância já está conectada e ativa!',
            instanceName: targetInstance,
          });
        }
      }
    } catch (e) {
      console.warn('Failed to check connection state, proceeding to connect:', e);
    }

    // 2. Request QR code connection
    let connectRes = await fetch(`${baseUrl}/instance/connect/${cleanInstance}`, {
      headers: { apikey: key },
      cache: 'no-store',
    });

    // 3. If 404, instance does not exist in Evolution API yet. Create it automatically!
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
        await configureWebhook();
        const base64 = createData?.qrcode?.base64 || createData?.base64;
        if (base64) {
          return NextResponse.json({
            connected: false,
            status: 'qrcode',
            qrcode: base64,
            pairingCode: createData?.qrcode?.pairingCode || null,
            instanceName: targetInstance,
          });
        }
        // If not immediately returned in create, retry connect endpoint
        connectRes = await fetch(`${baseUrl}/instance/connect/${cleanInstance}`, {
          headers: { apikey: key },
          cache: 'no-store',
        });
      } else {
        const createErr = await createRes.text();
        return NextResponse.json(
          { error: `Erro ao criar instância na Evolution API: ${createErr}` },
          { status: createRes.status }
        );
      }
    }

    if (!connectRes.ok) {
      const errorText = await connectRes.text();
      return NextResponse.json(
        { error: `Erro na Evolution API: ${errorText}` },
        { status: connectRes.status }
      );
    }

    const data = await connectRes.json();
    await configureWebhook();
    const base64 = data?.base64 || data?.qrcode?.base64;
    const isStateOpen = data?.instance?.state === 'open';

    if (isStateOpen) {
      return NextResponse.json({
        connected: true,
        status: 'connected',
        message: 'WhatsApp conectado com sucesso!',
        instanceName: targetInstance,
      });
    }

    if (base64) {
      return NextResponse.json({
        connected: false,
        status: 'qrcode',
        qrcode: base64,
        pairingCode: data?.pairingCode || null,
        instanceName: targetInstance,
      });
    }

    return NextResponse.json({
      connected: false,
      status: 'pending',
      message: 'Instância em inicialização, aguarde alguns segundos e tente novamente.',
      instanceName: targetInstance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao conectar com o WhatsApp' },
      { status: 500 }
    );
  }
}
