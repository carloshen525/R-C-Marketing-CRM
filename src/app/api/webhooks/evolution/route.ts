import { NextRequest, NextResponse } from 'next/server';
import { MetaConversionsService } from '@/lib/meta/conversions-api.service';
import { MetaGraphApiService } from '@/lib/meta/graph-api.service';
import { Lead } from '@/lib/types';

/**
 * Evolution API Webhook Handler
 * Native processing - NO n8n required!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event || body.type;
    const instance = body.instance;

    console.log(`[Webhook Evolution] Received event: ${event} for instance: ${instance}`);

    if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
      const messageData = body.data?.message || body.data;
      const key = body.data?.key || messageData?.key;

      // Ignore messages sent by self or group messages
      if (key?.fromMe || key?.remoteJid?.includes('@g.us')) {
        return NextResponse.json({ status: 'ignored', reason: 'from_me_or_group' });
      }

      const remoteJid = key?.remoteJid || '';
      const rawPhone = remoteJid.split('@')[0];
      const pushName = body.data?.pushName || 'Novo Contato';

      // Check Click-to-WhatsApp referral
      // Evolution API forwards WhatsApp Baileys / Cloud referral object
      const contextInfo =
        messageData?.extendedTextMessage?.contextInfo ||
        messageData?.message?.extendedTextMessage?.contextInfo ||
        body.data?.message?.extendedTextMessage?.contextInfo ||
        body.data?.contextInfo;

      const referral =
        body.data?.referral ||
        contextInfo?.externalAdReply ||
        contextInfo?.referral ||
        messageData?.referral ||
        body.data?.message?.referral;

      const ctwaClid = referral?.ctwaClid || referral?.ctwa_clid || referral?.referralParam;
      const sourceId = referral?.sourceId || referral?.source_id || referral?.sourceUrl;
      const adId = referral?.adId || referral?.ad_id || (sourceId && /^\d+$/.test(sourceId) ? sourceId : undefined);
      const isOrganic = !ctwaClid;

      let campaignName = 'Campanha Meta Ads';
      let adsetName = 'Conjunto de Anúncios';
      let adName = referral?.title || referral?.headline || 'Anúncio WhatsApp';

      // Enrich with Meta Graph API if adId is available
      if (adId) {
        const adDetails = await MetaGraphApiService.getAdDetails(adId);
        if (adDetails) {
          if (adDetails.campaignName) campaignName = adDetails.campaignName;
          if (adDetails.adsetName) adsetName = adDetails.adsetName;
          if (adDetails.adName) adName = adDetails.adName;
        }
      }

      const leadPayload: Partial<Lead> = {
        name: pushName,
        phone: rawPhone,
        is_organic: isOrganic,
        ctwa_clid: ctwaClid,
        source_id: sourceId,
        platform: referral ? 'instagram' : 'organic',
        campaign_name: isOrganic ? undefined : campaignName,
        adset_name: isOrganic ? undefined : adsetName,
        ad_name: isOrganic ? undefined : adName,
      };

      // If new CTWA lead, send LeadSubmitted event to Meta Conversions API (idempotent: only on creation)
      let metaResult = null;
      if (!isOrganic && ctwaClid) {
        metaResult = await MetaConversionsService.sendLeadSubmitted(leadPayload as Lead);
      }

      return NextResponse.json({
        status: 'processed',
        event,
        lead: {
          phone: rawPhone,
          name: pushName,
          isOrganic,
          ctwaClid: ctwaClid || null,
          campaignName,
          adName,
          leadSubmittedSent: metaResult?.success || false,
        },
      });
    }

    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
      const state = body.data?.state || body.data?.status;
      return NextResponse.json({ status: 'connection_updated', state });
    }

    return NextResponse.json({ status: 'acknowledged', event });
  } catch (error) {
    console.error('[Webhook Evolution] Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
