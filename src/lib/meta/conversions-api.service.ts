import { sha256 } from './tracking-utils';
import { Lead, MetaIntegration } from '../types';

export interface CapiSendResult {
  success: boolean;
  eventId: string;
  responseId?: string;
  eventsReceived?: number;
  fbtraceId?: string;
  errorMessage?: string;
  payload: Record<string, unknown>;
  responseData?: Record<string, unknown>;
}

export class MetaConversionsService {
  private static readonly GRAPH_API_VERSION = 'v25.0';
  private static readonly GRAPH_BASE_URL = 'https://graph.facebook.com';
  private static pixelCache: Record<string, string> = {};

  /**
   * Auto-discovers the active Pixel ID from Meta Graph API using the permanent access token
   */
  static async autoDiscoverPixel(accessToken: string): Promise<string | null> {
    if (!accessToken || accessToken.startsWith('demo_')) return null;
    if (this.pixelCache[accessToken]) return this.pixelCache[accessToken];

    try {
      const res = await fetch(
        `${this.GRAPH_BASE_URL}/${this.GRAPH_API_VERSION}/me/adaccounts?fields=id,name,adspixels{id,name}&access_token=${accessToken}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const accounts = data?.data || [];
      for (const acc of accounts) {
        const pixels: Array<{ id: string; name: string }> = acc?.adspixels?.data || [];
        if (pixels.length > 0) {
          const match =
            pixels.find(
              (p) =>
                p.name.toLowerCase().includes('whatstracker') ||
                p.name.toLowerCase().includes('whatsapp') ||
                p.name.toLowerCase().includes('saber mais')
            ) || pixels[0];
          if (match?.id) {
            this.pixelCache[accessToken] = match.id;
            console.log(`[Meta CAPI] Auto-discovered Pixel: ${match.name} (${match.id})`);
            return match.id;
          }
        }
      }
    } catch (e) {
      console.warn('[Meta CAPI] Auto-discovery of Pixel failed:', e);
    }
    return null;
  }

  /**
   * Sends the LeadSubmitted event to Meta Conversions API
   * Exactly reproduces the n8n "Enviar conversão de Lead para a META" node.
   */
  static async sendLeadSubmitted(
    lead: Lead,
    metaConfig?: Partial<MetaIntegration>
  ): Promise<CapiSendResult> {
    if (lead.is_organic || !lead.ctwa_clid) {
      return {
        success: false,
        eventId: `lead_sub_${lead.id}`,
        errorMessage: 'Lead orgânico - sem rastreamento Meta.',
        payload: { reason: 'organic_lead_skipped' },
      };
    }

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `lead_sub_${lead.phone || lead.id}`;
    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
    const phoneHash = sha256(cleanPhone);
    const pageId = lead.page_id || metaConfig?.page_id || '560563063815546';

    const payload: Record<string, unknown> = {
      data: [
        {
          action_source: 'business_messaging',
          event_name: 'LeadSubmitted',
          event_time: eventTime,
          messaging_channel: 'whatsapp',
          user_data: {
            ph: phoneHash,
            ctwa_clid: lead.ctwa_clid,
            page_id: pageId,
          },
        },
      ],
      ...(metaConfig?.test_event_code ? { test_event_code: metaConfig.test_event_code } : {}),
    };

    const targetPixel = lead.pixel_id || metaConfig?.pixel_id || '1838816967308658';
    const effectiveToken =
      metaConfig?.access_token ||
      process.env.META_ACCESS_TOKEN ||
      process.env.META_CAPI_ACCESS_TOKEN ||
      'EAAjy7fZAjxjsBSVev7bxevLHPjUA4yhuuy9Hepi1XFjIu1R9OslsXMy1XKf53UdyCh4KiHQbKwGY8eeM9WVh11NY4FNP1ZBZABq0TKzamF6nbaejveNqPBD7ss8DLoawVZAoUaBKVMOqwa3EjsU6jr9O2G94MRXXan8iVpIxusvFZCZBdzSR0rYci3W73OtjFufwZDZD';

    return this.dispatchToMeta(targetPixel, effectiveToken, payload, eventId);
  }

  /**
   * Sends the Purchase event to Meta Conversions API
   * Exactly reproduces the n8n "envia dados de compra" node.
   */
  static async sendPurchase(
    lead: Lead,
    saleData: {
      amount: number;
      currency?: string;
      productName?: string;
      saleDate?: string;
    },
    metaConfig?: Partial<MetaIntegration>
  ): Promise<CapiSendResult> {
    if (lead.is_organic || !lead.ctwa_clid) {
      return {
        success: false,
        eventId: `purchase_${lead.id}`,
        errorMessage: 'Lead orgânico - rastreamento Meta desabilitado.',
        payload: { reason: 'organic_purchase_skipped' },
      };
    }

    const eventTime = Math.floor(
      (saleData.saleDate ? new Date(saleData.saleDate).getTime() : Date.now()) / 1000
    );
    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
    const phoneHash = sha256(cleanPhone);
    const pageId = lead.page_id || metaConfig?.page_id || '560563063815546';
    const amountVal = Number(saleData.amount || 0).toFixed(2);

    const payload: Record<string, unknown> = {
      data: [
        {
          action_source: 'business_messaging',
          event_name: 'Purchase',
          event_time: eventTime,
          messaging_channel: 'whatsapp',
          event_id: cleanPhone || lead.id,
          user_data: {
            ph: phoneHash,
            ctwa_clid: lead.ctwa_clid,
            page_id: pageId,
          },
          custom_data: {
            currency: saleData.currency || 'BRL',
            value: amountVal,
          },
        },
      ],
      ...(metaConfig?.test_event_code ? { test_event_code: metaConfig.test_event_code } : {}),
    };

    const targetPixel = lead.pixel_id || metaConfig?.pixel_id || '1838816967308658';
    const effectiveToken =
      metaConfig?.access_token ||
      process.env.META_ACCESS_TOKEN ||
      process.env.META_CAPI_ACCESS_TOKEN ||
      'EAAjy7fZAjxjsBSVev7bxevLHPjUA4yhuuy9Hepi1XFjIu1R9OslsXMy1XKf53UdyCh4KiHQbKwGY8eeM9WVh11NY4FNP1ZBZABq0TKzamF6nbaejveNqPBD7ss8DLoawVZAoUaBKVMOqwa3EjsU6jr9O2G94MRXXan8iVpIxusvFZCZBdzSR0rYci3W73OtjFufwZDZD';

    return this.dispatchToMeta(targetPixel, effectiveToken, payload, cleanPhone || lead.id);
  }

  /**
   * Performs the HTTP request to Meta Graph API Conversions API endpoint
   */
  private static async dispatchToMeta(
    pixelId?: string,
    accessToken?: string,
    payload: Record<string, unknown> = {},
    eventId: string = ''
  ): Promise<CapiSendResult> {
    const effectiveToken =
      accessToken ||
      process.env.META_ACCESS_TOKEN ||
      process.env.META_CAPI_ACCESS_TOKEN ||
      'EAAjy7fZAjxjsBSVev7bxevLHPjUA4yhuuy9Hepi1XFjIu1R9OslsXMy1XKf53UdyCh4KiHQbKwGY8eeM9WVh11NY4FNP1ZBZABq0TKzamF6nbaejveNqPBD7ss8DLoawVZAoUaBKVMOqwa3EjsU6jr9O2G94MRXXan8iVpIxusvFZCZBdzSR0rYci3W73OtjFufwZDZD';

    let targetPixel = pixelId || process.env.META_PIXEL_ID || '1838816967308658';

    // Auto-discover pixel if missing or placeholder and real token is present
    if ((!targetPixel || targetPixel.startsWith('pixel_')) && effectiveToken && effectiveToken.startsWith('EAA')) {
      const discovered = await this.autoDiscoverPixel(effectiveToken);
      if (discovered) {
        targetPixel = discovered;
      }
    }

    try {
      const url = `${this.GRAPH_BASE_URL}/${this.GRAPH_API_VERSION}/${targetPixel}/events?access_token=${effectiveToken}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data?.error) {
        const errorMsg = data?.error?.message || `Meta API HTTP error ${response.status}`;
        console.error('[Meta CAPI] Error dispatching event:', data);
        return {
          success: false,
          eventId,
          errorMessage: errorMsg,
          fbtraceId: data?.error?.fbtrace_id,
          payload,
          responseData: data,
        };
      }

      console.log(`[Meta CAPI] Event successfully sent to Pixel ${targetPixel}:`, data);
      return {
        success: true,
        eventId,
        eventsReceived: data.events_received || 1,
        fbtraceId: data.fbtrace_id,
        responseId: data.fbtrace_id || `fb_${Date.now()}`,
        payload,
        responseData: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com a Meta Graph API';
      console.error('[Meta CAPI] Network error:', err);
      return {
        success: false,
        eventId,
        errorMessage: msg,
        payload,
      };
    }
  }
}
