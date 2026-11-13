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
  private static readonly GRAPH_API_VERSION = 'v20.0';
  private static readonly GRAPH_BASE_URL = 'https://graph.facebook.com';

  /**
   * Enriches lead with Meta Ads hierarchy: Campaign -> AdSet -> Ad
   */
  static async getAdDetails(
    adId: string,
    accessToken?: string
  ): Promise<MetaAdMetadata | null> {
    if (!adId) return null;

    if (!accessToken || accessToken.startsWith('demo_')) {
      // In demo mode, return realistic structured Meta Ads metadata
      return {
        adId,
        adName: `AD_${adId.slice(-4)} - Criativo Vídeo WhatsApp`,
        adsetId: `adset_${adId.slice(0, 6)}`,
        adsetName: 'Público Aberto - 25 a 45 anos (BR)',
        campaignId: `camp_${adId.slice(0, 5)}`,
        campaignName: 'Campanha Conversão - WhatsApp Leads',
      };
    }

    try {
      const url = `${this.GRAPH_BASE_URL}/${this.GRAPH_API_VERSION}/${adId}?fields=id,name,adset{id,name},campaign{id,name}&access_token=${accessToken}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[MetaGraphApiService] Failed to fetch ad ${adId}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        adId: data.id,
        adName: data.name,
        adsetId: data.adset?.id,
        adsetName: data.adset?.name,
        campaignId: data.campaign?.id,
        campaignName: data.campaign?.name,
      };
    } catch (err) {
      console.error('[MetaGraphApiService] Error fetching ad metadata:', err);
      return null;
    }
  }
}
