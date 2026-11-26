import { MetaIntegration } from '../types';
import { initialMetaIntegrations } from '../initial-data';

const AMADEUS_COMPANY_ID = 'comp_amadeus';
const AMADEUS_PIXEL_ID = process.env.AMADEUS_META_PIXEL_ID || '2041232726494699';
const AMADEUS_PAGE_ID = process.env.AMADEUS_META_PAGE_ID || '551732564683424';
const AMADEUS_ACCESS_TOKEN = process.env.AMADEUS_META_ACCESS_TOKEN || '';

/**
 * Server-side Meta credentials per tenant.
 * Tokens are read from environment variables and are never committed or sent
 * to the browser. Without a token, ad enrichment and CAPI are skipped for
 * that tenant instead of falling back to another company's pixel.
 */
export function getCompanyMetaIntegration(
  companyId?: string | null
): MetaIntegration | undefined {
  if (!companyId) return undefined;

  if (companyId === AMADEUS_COMPANY_ID) {
    return {
      id: 'meta_amadeus',
      company_id: AMADEUS_COMPANY_ID,
      tenant_id: AMADEUS_COMPANY_ID,
      pixel_id: AMADEUS_PIXEL_ID,
      page_id: AMADEUS_PAGE_ID,
      access_token: AMADEUS_ACCESS_TOKEN,
      graph_api_version: 'v25.0',
      last_conversion_sent_at: 'Nenhuma conversão enviada',
      is_active: Boolean(AMADEUS_ACCESS_TOKEN),
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
  }

  return initialMetaIntegrations[companyId];
}
