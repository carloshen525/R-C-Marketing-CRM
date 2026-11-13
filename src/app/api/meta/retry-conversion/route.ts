import { NextRequest, NextResponse } from 'next/server';
import { MetaConversionsService } from '@/lib/meta/conversions-api.service';
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

    const result = await MetaConversionsService.sendPurchase(lead as Lead, saleData, metaConfig);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API retry-conversion] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
