import { NextRequest, NextResponse } from 'next/server';
import { MetaConversionsService } from '@/lib/meta/conversions-api.service';
import { MetaGraphApiService } from '@/lib/meta/graph-api.service';
import { getStoredLeads, saveLead, saveMessage } from '@/lib/server/leads-storage';
import { Lead, Message } from '@/lib/types';

/**
 * Evolution API Webhook Handler
 * Native processing - NO n8n required!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event || body.type;
    const instance = body.instance || 'Carlos1';

    console.log(`[Webhook Evolution] Received event: ${event} for instance: ${instance}`);

    if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
      const messageData = body.data?.message || body.data;
      const key = body.data?.key || messageData?.key;

      // Ignore messages sent by self or group messages
      if (key?.fromMe || key?.remoteJid?.includes('@g.us')) {
        return NextResponse.json({ status: 'ignored', reason: 'from_me_or_group' });
      }

      // Handle WhatsApp LID privacy addressing: remoteJidAlt has real @s.whatsapp.net phone number
      const remoteJidAlt = key?.remoteJidAlt;
      const realJid =
        remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')
          ? remoteJidAlt
          : key?.remoteJid || '';

      const rawPhone = realJid.split('@')[0].replace(/\D/g, '');
      const pushName = body.data?.pushName || 'Novo Lead';

      // Check Click-to-WhatsApp referral
      // Evolution API forwards WhatsApp Baileys / Cloud referral object & contextInfo
      const contextInfo =
        body.data?.contextInfo ||
        messageData?.extendedTextMessage?.contextInfo ||
        messageData?.message?.extendedTextMessage?.contextInfo ||
        body.data?.message?.extendedTextMessage?.contextInfo;

      const isFBAds =
        contextInfo?.conversionSource === 'FB_Ads' ||
        Boolean(contextInfo?.ctwaPayload) ||
        Boolean(contextInfo?.conversionData) ||
        Boolean(contextInfo?.externalAdReply);

      const referral =
        body.data?.referral ||
        contextInfo?.externalAdReply ||
        contextInfo?.referral ||
        messageData?.referral ||
        body.data?.message?.referral;

      const ctwaClid =
        contextInfo?.ctwaPayload ||
        contextInfo?.conversionData ||
        referral?.ctwaClid ||
        referral?.ctwa_clid ||
        referral?.referralParam;

      const sourceId = referral?.sourceId || referral?.source_id || referral?.sourceUrl;
      const adId = referral?.adId || referral?.ad_id || (sourceId && /^\d+$/.test(sourceId) ? sourceId : undefined);
      const isOrganic = !ctwaClid && !isFBAds;

      const messageContent =
        body.data?.message?.conversation ||
        messageData?.conversation ||
        messageData?.extendedTextMessage?.text ||
        'Mensagem recebida pelo WhatsApp';

      let campaignName = isOrganic ? undefined : '[Eng] [Jogo da Memória das Silabas] [10.11]';
      let adsetName = isOrganic ? undefined : '[25-40] [Mulheres]';
      let adName = isOrganic
        ? undefined
        : referral?.title || referral?.headline || '01 - Jogo da Memória das Sílabas';

      // Enrich with Meta Graph API if adId is available
      if (adId) {
        const adDetails = await MetaGraphApiService.getAdDetails(adId);
        if (adDetails) {
          if (adDetails.campaignName) campaignName = adDetails.campaignName;
          if (adDetails.adsetName) adsetName = adDetails.adsetName;
          if (adDetails.adName) adName = adDetails.adName;
        }
      }

      // Check existing lead
      const existingLeads = getStoredLeads();
      const existing = existingLeads.find((l) => l.phone === rawPhone);
      const companyId = existing?.company_id || 'comp_pedagogicos';
      const leadId = existing?.id || `lead_wa_${rawPhone}_${Date.now()}`;

      let metaResult = null;
      let isNewLead = !existing;

      const leadPayload: Lead = existing
        ? {
            ...existing,
            last_interaction_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            id: leadId,
            company_id: companyId,
            stage_id: 'stage_1',
            name: pushName,
            phone: rawPhone,
            is_organic: isOrganic,
            ctwa_clid: ctwaClid,
            source_id: sourceId,
            platform: isOrganic
              ? 'organic'
              : (sourceId?.includes('facebook') || referral?.sourceUrl?.includes('facebook'))
              ? 'facebook'
              : 'instagram',
            campaign_name: campaignName,
            adset_name: adsetName,
            ad_name: adName,
            lead_submitted_sent: false,
            sale_amount: 0,
            currency: 'BRL',
            sale_status: 'none',
            purchase_sent: false,
            purchase_meta_status: 'none',
            first_message_at: new Date().toISOString(),
            last_interaction_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      // If new CTWA lead, send LeadSubmitted event to Meta Conversions API
      if (isNewLead && !isOrganic && ctwaClid) {
        metaResult = await MetaConversionsService.sendLeadSubmitted(leadPayload);
        if (metaResult?.success) {
          leadPayload.lead_submitted_sent = true;
          leadPayload.lead_submitted_at = new Date().toISOString();
          leadPayload.lead_submitted_response_id = metaResult.fbtraceId || metaResult.responseId;
        }
      }

      // Save lead to persistent server storage
      saveLead(leadPayload);

      // Save message to conversation store
      const msgId = body.data?.key?.id || `msg_${Date.now()}`;
      const newMsg: Message = {
        id: msgId,
        company_id: companyId,
        conversation_id: `conv_${leadId}`,
        lead_id: leadId,
        sender_type: 'lead',
        message_id: msgId,
        content: messageContent,
        status: 'delivered',
        is_from_me: false,
        created_at: new Date().toISOString(),
      };
      saveMessage(leadId, newMsg);

      return NextResponse.json({
        status: 'processed',
        event,
        isNewLead,
        lead: {
          id: leadPayload.id,
          phone: rawPhone,
          name: pushName,
          isOrganic,
          ctwaClid: ctwaClid || null,
          campaignName,
          adName,
          leadSubmittedSent: leadPayload.lead_submitted_sent,
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
