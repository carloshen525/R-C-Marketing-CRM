import { NextRequest, NextResponse } from 'next/server';
import { MetaConversionsService } from '@/lib/meta/conversions-api.service';
import { getCompanyMetaIntegration } from '@/lib/server/meta-config';
import { Lead } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { lead, saleData, metaConfig } = await req.json();

    if (!lead || !lead.ctwa_clid) {
      return NextResponse.json(
        { error: 'Lead sem rastreamento Meta (CTWA CLID ausente).' },
        { status: 400 }
      );
    }

    const serverConfig = getCompanyMetaIntegration((lead as Lead).company_id);
    const effectiveConfig = serverConfig ? serverConfig : metaConfig;

    if (!effectiveConfig?.access_token) {
      return NextResponse.json(
        { error: 'Integração Meta não configurada para esta empresa.' },
        { status: 400 }
      );
    }

    const result = await MetaConversionsService.sendPurchase(
      lead as Lead,
      saleData,
      effectiveConfig
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API retry-conversion] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
