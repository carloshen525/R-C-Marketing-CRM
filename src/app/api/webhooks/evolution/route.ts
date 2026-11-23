import { NextRequest, NextResponse } from 'next/server';
import { MetaConversionsService } from '@/lib/meta/conversions-api.service';
import { MetaGraphApiService } from '@/lib/meta/graph-api.service';
import { getStoredLeads, saveLead, saveMessage } from '@/lib/server/leads-storage';
import { Lead, Message } from '@/lib/types';
import { mapEvolutionWebhook, extractMoneyValues } from '@/lib/meta/tracking-utils';

/**
 * Evolution API Webhook Handler - 100% Native Implementation of WhatsTracker Architecture
 * 
 * Supports both Evolution Go and Evolution API v1/v2 payloads.
 * Features:
 *  1. FLUXO DE LEAD (fromMe == false):
 *     - Detects CTWA referral (ctwaClid, sourceID, sourceApp).
 *     - Fetches Meta Graph API v25.0 to extract pixel_id, page_id, campaign, adset, and ad names.
 *     - Creates or updates lead in database with full tracking specs.
 *     - Hashes phone with SHA-256 and sends LeadSubmitted to Meta CAPI.
 * 
 *  2. FLUXO DE COMPRA (fromMe == true):
 *     - Detects sale confirmations (e.g. 'Cadastro Realizado!', 'PIX recebido', or monetary amounts).
 *     - Parses monetary value (e.g. R$ 5,00, 120.000,00).
 *     - Looks up lead by phone or LID.
 *     - Updates lead stage to Venda Concluída and sends Purchase event to Meta CAPI.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.event || body?.type || 'Message';
    const instance = body?.instanceName || body?.instance || 'Carlos1';

    console.log(`[Webhook Evolution] Received event: ${event} for instance: ${instance}`);

    // Ignore connection update events cleanly
    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
      const state = body.data?.state || body.data?.status;
      return NextResponse.json({ status: 'connection_updated', state });
    }

    // Map incoming webhook payload using the unified extractor
    const mapped = mapEvolutionWebhook(body);

    if (!mapped.telefone || mapped.telefone.length < 8) {
      return NextResponse.json({ status: 'ignored', reason: 'no_valid_phone' });
    }

    // Skip messages to/from own instance phone
    if (mapped.telefone === '556282002147') {
      return NextResponse.json({ status: 'ignored', reason: 'own_instance_phone' });
    }

    const existingLeads = getStoredLeads();
    // Look up lead by phone or LID
    let lead = existingLeads.find(
      (l) =>
        l.phone === mapped.telefone ||
        (mapped.lid && l.lid === mapped.lid) ||
        (l.id && l.id.includes(mapped.telefone))
    );

    const companyId = lead?.company_id || 'comp_pedagogicos';
    const leadId = lead?.id || `lead_wa_${mapped.telefone}_${Date.now()}`;

    // =========================================================================
    // BRANCH 1: FLUXO DE LEAD (Recebi a mensagem: fromme == false)
    // =========================================================================
    if (!mapped.fromme) {
      const hasCtwa = Boolean(mapped.ctwaclid);

      // If no ctwa_clid exists: Stop ad flow, handle as organic
      if (!hasCtwa) {
        if (!lead) {
          lead = {
            id: leadId,
            company_id: companyId,
            stage_id: 'stage_1',
            name: mapped.rawPushName || `Lead ${mapped.telefone.slice(-4)}`,
            phone: mapped.telefone,
            lid: mapped.lid || undefined,
            is_organic: true,
            platform: 'organic',
            product_name: 'Jogo da Memória das Sílabas',
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
          saveLead(lead);
        } else {
          lead.last_interaction_at = new Date().toISOString();
          if (mapped.lid && !lead.lid) lead.lid = mapped.lid;
          saveLead(lead);
        }

        // Save incoming message
        saveIncomingMessage(lead.id, companyId, mapped.mensagem, body?.data?.key?.id);

        return NextResponse.json({
          status: 'processed',
          flow: 'organic_lead',
          phone: mapped.telefone,
        });
      }

      // CTWA Clid is present! Query Meta Graph API v25.0 for Ad details & Tracking Specs
      console.log(`[Webhook Evolution] CTWA Detected! Source ID: ${mapped.source_id}, Clid: ${mapped.ctwaclid?.substring(0, 20)}...`);

      let adDetails = null;
      if (mapped.source_id) {
        adDetails = await MetaGraphApiService.getAdDetails(mapped.source_id);
      }

      const campaignName = adDetails?.campaignName || '[Eng] [Jogo da Memória das Silabas] [10.11]';
      const campaignId = adDetails?.campaignId || '120250535297470101';
      const adsetName = adDetails?.adsetName || '[25-40] [Mulheres]';
      const adsetId = adDetails?.adsetId;
      const adName = adDetails?.adName || '01 - Jogo da Memória das Sílabas';
      const adId = adDetails?.adId || mapped.source_id;
      const pixelId = adDetails?.pixelId || '1838816967308658';
      const pageId = adDetails?.pageId || '560563063815546';

      let isNewLead = false;

      if (!lead) {
        // Cria lead novo no banco de dados
        isNewLead = true;
        lead = {
          id: leadId,
          company_id: companyId,
          stage_id: 'stage_1',
          name: mapped.rawPushName || `${mapped.first_name} ${mapped.last_name}`.trim(),
          phone: mapped.telefone,
          lid: mapped.lid || undefined,
          is_organic: false,
          ctwa_clid: mapped.ctwaclid,
          source_id: mapped.source_id,
          platform: mapped.plataforma === 'facebook' ? 'facebook' : 'instagram',
          campaign_id: campaignId,
          campaign_name: campaignName,
          adset_id: adsetId,
          adset_name: adsetName,
          ad_id: adId,
          ad_name: adName,
          pixel_id: pixelId,
          page_id: pageId,
          product_name: 'Jogo da Memória das Sílabas',
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
      } else {
        // Atualiza Lead existente
        lead.ctwa_clid = mapped.ctwaclid;
        lead.source_id = mapped.source_id || lead.source_id;
        lead.page_id = pageId || lead.page_id;
        lead.pixel_id = pixelId || lead.pixel_id;
        lead.campaign_id = campaignId || lead.campaign_id;
        lead.campaign_name = campaignName || lead.campaign_name;
        lead.adset_id = adsetId || lead.adset_id;
        lead.adset_name = adsetName || lead.adset_name;
        lead.ad_id = adId || lead.ad_id;
        lead.ad_name = adName || lead.ad_name;
        lead.platform = mapped.plataforma === 'facebook' ? 'facebook' : 'instagram';
        lead.is_organic = false;
        lead.lid = mapped.lid || lead.lid;
        lead.last_interaction_at = new Date().toISOString();
        lead.updated_at = new Date().toISOString();
      }

      // Enviar conversão de LeadSubmitted para a Meta CAPI
      if (!lead.lead_submitted_sent) {
        console.log(`[Webhook Evolution] Sending LeadSubmitted to Meta Pixel ${pixelId} for lead ${lead.phone}...`);
        const metaResult = await MetaConversionsService.sendLeadSubmitted(lead);
        if (metaResult?.success) {
          lead.lead_submitted_sent = true;
          lead.lead_submitted_at = new Date().toISOString();
          lead.lead_submitted_response_id = metaResult.fbtraceId || metaResult.responseId;
        }
      }

      // Save lead
      saveLead(lead);

      // Save incoming message
      saveIncomingMessage(lead.id, companyId, mapped.mensagem, body?.data?.key?.id);

      return NextResponse.json({
        status: 'processed',
        flow: 'ctwa_lead_submitted',
        isNewLead,
        leadId: lead.id,
        phone: mapped.telefone,
        campaign: campaignName,
        pixelId,
        pageId,
        leadSubmittedSent: lead.lead_submitted_sent,
      });
    }

    // =========================================================================
    // BRANCH 2: FLUXO DE COMPRA (Enviei a mensagem: fromme == true)
    // =========================================================================
    // Save outgoing message to conversation
    saveOutgoingMessage(leadId, companyId, mapped.mensagem, body?.data?.key?.id);

    // Check if the message indicates a sale approval trigger
    const msgText = mapped.mensagem || '';
    const isApprovalTrigger =
      msgText.includes('Cadastro Realizado!') ||
      msgText.includes('compra aprovada') ||
      msgText.includes('comprovante') ||
      msgText.includes('enviei o material') ||
      msgText.includes('Pix:');

    const moneyValues = extractMoneyValues(msgText);
    const hasMoney = moneyValues.length > 0;

    // If it's a purchase confirmation and we have a tracked lead with ctwa_clid
    if ((isApprovalTrigger || hasMoney) && lead && !lead.is_organic && lead.ctwa_clid) {
      const totalAmount = hasMoney
        ? moneyValues.reduce((a, b) => a + b, 0)
        : lead.sale_amount > 0
        ? lead.sale_amount
        : 5.0;

      console.log(`[Webhook Evolution] Outgoing Purchase Detected! Lead: ${lead.name} (${lead.phone}), Value: R$ ${totalAmount}`);

      lead.stage_id = 'stage_5'; // Venda Concluída
      lead.sale_amount = totalAmount;
      lead.currency = 'BRL';
      lead.sale_status = 'paid';
      lead.sale_date = new Date().toISOString();
      lead.last_interaction_at = new Date().toISOString();

      // Ensure page_id and pixel_id are loaded if missing
      if ((!lead.pixel_id || !lead.page_id) && lead.source_id) {
        const adDetails = await MetaGraphApiService.getAdDetails(lead.source_id);
        if (adDetails?.pixelId) lead.pixel_id = adDetails.pixelId;
        if (adDetails?.pageId) lead.page_id = adDetails.pageId;
      }

      // Envia dados de compra para a Meta CAPI
      if (!lead.purchase_sent) {
        const purchaseResult = await MetaConversionsService.sendPurchase(lead, {
          amount: totalAmount,
          currency: 'BRL',
          productName: lead.product_name || 'Jogo da Memória das Sílabas',
          saleDate: lead.sale_date,
        });

        if (purchaseResult.success) {
          lead.purchase_sent = true;
          lead.purchase_sent_at = new Date().toISOString();
          lead.purchase_meta_status = 'sent';
          lead.purchase_response_id = purchaseResult.fbtraceId || purchaseResult.responseId;
        } else {
          lead.purchase_meta_status = 'failed';
          lead.purchase_meta_error = purchaseResult.errorMessage;
        }
      }

      saveLead(lead);

      return NextResponse.json({
        status: 'processed',
        flow: 'purchase_recorded',
        phone: mapped.telefone,
        amount: totalAmount,
        purchaseSent: lead.purchase_sent,
      });
    }

    return NextResponse.json({
      status: 'processed',
      flow: 'outgoing_message_saved',
      phone: mapped.telefone,
    });
  } catch (error) {
    console.error('[Webhook Evolution] Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

function saveIncomingMessage(leadId: string, companyId: string, text: string, messageId?: string) {
  if (!text) return;
  const msgId = messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const msg: Message = {
    id: msgId,
    company_id: companyId,
    conversation_id: `conv_${leadId}`,
    lead_id: leadId,
    sender_type: 'lead',
    message_id: msgId,
    content: text,
    status: 'delivered',
    is_from_me: false,
    created_at: new Date().toISOString(),
  };
  saveMessage(leadId, msg);
}

function saveOutgoingMessage(leadId: string, companyId: string, text: string, messageId?: string) {
  if (!text) return;
  const msgId = messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const msg: Message = {
    id: msgId,
    company_id: companyId,
    conversation_id: `conv_${leadId}`,
    lead_id: leadId,
    sender_type: 'agent',
    message_id: msgId,
    content: text,
    status: 'delivered',
    is_from_me: true,
    created_at: new Date().toISOString(),
  };
  saveMessage(leadId, msg);
}
