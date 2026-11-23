import { findDatasetAndPage } from './tracking-utils';

export interface MetaAdMetadata {
  adId: string;
  adName: string;
  adsetId?: string;
  adsetName?: string;
  campaignId?: string;
  campaignName?: string;
  pixelId?: string;
  pageId?: string;
}

export class MetaGraphApiService {
  private static readonly GRAPH_API_VERSION = 'v25.0';
  private static readonly GRAPH_BASE_URL = 'https://graph.facebook.com';

  /**
   * Enriches lead with Meta Ads hierarchy: Campaign -> AdSet -> Ad + Tracking Specs (Pixel ID & Page ID)
   * Matches the HTTP Request and code extraction from n8n WhatsTracker workflow.
   */
  static async getAdDetails(
    sourceId: string,
    accessToken?: string
  ): Promise<MetaAdMetadata | null> {
    if (!sourceId) return null;

    const effectiveToken =
      accessToken ||
      process.env.META_ACCESS_TOKEN ||
      process.env.META_CAPI_ACCESS_TOKEN ||
      'EAAjy7fZAjxjsBSVev7bxevLHPjUA4yhuuy9Hepi1XFjIu1R9OslsXMy1XKf53UdyCh4KiHQbKwGY8eeM9WVh11NY4FNP1ZBZABq0TKzamF6nbaejveNqPBD7ss8DLoawVZAoUaBKVMOqwa3EjsU6jr9O2G94MRXXan8iVpIxusvFZCZBdzSR0rYci3W73OtjFufwZDZD';

    if (!effectiveToken || effectiveToken.startsWith('demo_')) {
      return {
        adId: sourceId,
        adName: `AD_${sourceId.slice(-4)} - Criativo Vídeo WhatsApp`,
        adsetId: `adset_${sourceId.slice(0, 6)}`,
        adsetName: 'Público Aberto - 25 a 45 anos (BR)',
        campaignId: `camp_${sourceId.slice(0, 5)}`,
        campaignName: 'Campanha Conversão - WhatsApp Leads',
        pixelId: '1838816967308658',
        pageId: '560563063815546',
      };
    }

    try {
      const url = `${this.GRAPH_BASE_URL}/${this.GRAPH_API_VERSION}/${sourceId}?fields=name,campaign{name},adset{name},tracking_specs&access_token=${effectiveToken}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[MetaGraphApiService] Failed to fetch ad ${sourceId}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const extracted = findDatasetAndPage(data);

      return {
        adId: extracted.id_anuncio || data.id || sourceId,
        adName: extracted.nome_anuncio || data.name || 'Anúncio WhatsApp',
        adsetId: extracted.id_conjunto || data.adset?.id,
        adsetName: extracted.nome_conjunto || data.adset?.name,
        campaignId: extracted.id_campanha || data.campaign?.id,
        campaignName: extracted.nome_campanha || data.campaign?.name,
        pixelId: extracted.pixel_id[0] || undefined,
        pageId: extracted.page_id[0] || undefined,
      };
    } catch (err) {
      console.error('[MetaGraphApiService] Error fetching ad metadata from Meta:', err);
      return null;
    }
  }
}
