import { NextRequest, NextResponse } from 'next/server';
import { getCompanyMetaIntegration } from '@/lib/server/meta-config';

/**
 * Safe diagnostics endpoint: reports whether the server has tenant Meta
 * credentials configured without ever returning the access token.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id') || '';

  const config = getCompanyMetaIntegration(companyId);

  return NextResponse.json({
    companyId,
    hasToken: Boolean(config?.access_token),
    hasPixel: Boolean(config?.pixel_id),
    hasPage: Boolean(config?.page_id),
    pixelId: config?.pixel_id || null,
    pageId: config?.page_id || null,
    features: ['tenant-meta-status', 'lead-sync-enrichment'],
  });
}
