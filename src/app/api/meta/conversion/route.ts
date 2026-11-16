import { NextRequest, NextResponse } from 'next/server';
import { MetaConversionsService } from '@/lib/meta/conversions-api.service';
import { Lead } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { lead, saleData, metaConfig } = await req.json();

    if (!lead) {
      return NextResponse.json({ error: 'Lead não informado' }, { status: 400 });
    }

    // Call Conversions API on the server
    const result = await MetaConversionsService.sendPurchase(lead as Lead, saleData, metaConfig);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API meta/conversion] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
