import {
  sha256,
  normalizeAndHashPhone,
  normalizeAndHashName,
  normalizeAndHashEmail,
} from './crypto-utils';
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
  private static readonly GRAPH_API_VERSION = 'v20.0';
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
                p.name.toLowerCase().includes('whatsapp')
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
   * Requirement: Sent ONLY upon lead creation from CTWA, never on subsequent messages.
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
    const eventId = `lead_sub_${lead.id}`;
    const { fn, ln } = normalizeAndHashName(lead.name);

    const userData: Record<string, unknown> = {
      ph: [normalizeAndHashPhone(lead.phone)],
      ...(fn ? { fn: [fn] } : {}),
      ...(ln ? { ln: [ln] } : {}),
      ...(lead.email ? { em: [normalizeAndHashEmail(lead.email)] } : {}),
      ctwa_clid: lead.ctwa_clid,
    };

    const customData: Record<string, unknown> = {
      lead_type: 'whatsapp_click_to_chat',
      campaign_name: lead.campaign_name || 'Desconhecida',
      ad_name: lead.ad_name || 'Desconhecido',
      channel: lead.platform || 'whatsapp',
    };

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: 'LeadSubmitted',
          event_time: eventTime,
          event_id: eventId,
          action_source: 'chat',
          user_data: userData,
          custom_data: customData,
        },
      ],
      ...(metaConfig?.test_event_code ? { test_event_code: metaConfig.test_event_code } : {}),
    };

    return this.dispatchToMeta(metaConfig?.pixel_id, metaConfig?.access_token, payload, eventId);
  }

  /**
   * Sends the Purchase event to Meta Conversions API
   * Requirement: Triggered when operator confirms sale in the Won stage modal.
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
    const eventId = `purchase_${lead.id}_${eventTime}`;
    const { fn, ln } = normalizeAndHashName(lead.name);

    const userData: Record<string, unknown> = {
      ph: [normalizeAndHashPhone(lead.phone)],
      ...(fn ? { fn: [fn] } : {}),
      ...(ln ? { ln: [ln] } : {}),
      ...(lead.email ? { em: [normalizeAndHashEmail(lead.email)] } : {}),
      ctwa_clid: lead.ctwa_clid,
    };

    const customData: Record<string, unknown> = {
      currency: saleData.currency || 'BRL',
      value: saleData.amount,
      content_name: saleData.productName || 'Venda CRM',
      content_type: 'product',
      order_id: eventId,
      campaign_name: lead.campaign_name,
      ad_name: lead.ad_name,
    };

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: 'Purchase',
          event_time: eventTime,
          event_id: eventId,
          action_source: 'chat',
          user_data: userData,
          custom_data: customData,
        },
      ],
      ...(metaConfig?.test_event_code ? { test_event_code: metaConfig.test_event_code } : {}),
    };

    return this.dispatchToMeta(metaConfig?.pixel_id, metaConfig?.access_token, payload, eventId);
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
    const effectiveToken = accessToken || process.env.META_ACCESS_TOKEN || process.env.META_CAPI_ACCESS_TOKEN;
    let targetPixel = pixelId || process.env.META_PIXEL_ID;

    // Auto-discover pixel if missing or placeholder and real token is present
    if ((!targetPixel || targetPixel.startsWith('pixel_')) && effectiveToken && effectiveToken.startsWith('EAA')) {
      const discovered = await this.autoDiscoverPixel(effectiveToken);
      if (discovered) {
        targetPixel = discovered;
      }
    }

    // If no real credentials are configured, return a simulated successful response with real payload
    if (!targetPixel || !effectiveToken || effectiveToken.startsWith('demo_') || targetPixel.startsWith('demo_') || targetPixel.startsWith('pixel_')) {
      console.log('[Meta CAPI] Running in Demo/Simulated mode. Payload:', JSON.stringify(payload, null, 2));
      return {
        success: true,
        eventId,
        responseId: `sim_fb_${Date.now()}`,
        eventsReceived: 1,
        fbtraceId: `tr_${Math.random().toString(36).substring(2, 10)}`,
        payload,
        responseData: {
          events_received: 1,
          messages: [],
          fbtrace_id: `tr_${Math.random().toString(36).substring(2, 10)}`,
          status: 'simulated_success',
        },
      };
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
