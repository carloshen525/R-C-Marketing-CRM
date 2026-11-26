import fs from 'fs';
import path from 'path';
import { Lead, Message } from '../types';
import { initialWhatsAppInstances } from '../initial-data';
import { getCompanyMetaIntegration } from './meta-config';
import { MetaGraphApiService } from '../meta/graph-api.service';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('[LeadsStorage] Failed to create data dir:', e);
    }
  }
}

export function getStoredLeads(): Lead[] {
  ensureDataDir();
  if (!fs.existsSync(LEADS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[LeadsStorage] Error reading leads file:', e);
    return [];
  }
}

export function saveLead(lead: Lead): Lead {
  ensureDataDir();
  const leads = getStoredLeads();
  const index = leads.findIndex(
    (l) => l.id === lead.id || (lead.phone && l.phone === lead.phone && l.company_id === lead.company_id)
  );

  if (index >= 0) {
    const existing = leads[index];
    leads[index] = {
      ...existing,
      ...lead,
      // Protect progressed stage and sale status from being reverted by default initial fields
      stage_id:
        existing.stage_id && existing.stage_id !== 'stage_1' && lead.stage_id === 'stage_1'
          ? existing.stage_id
          : lead.stage_id || existing.stage_id,
      sale_status:
        existing.sale_status && existing.sale_status !== 'none' && lead.sale_status === 'none'
          ? existing.sale_status
          : lead.sale_status || existing.sale_status,
      sale_amount:
        existing.sale_amount && existing.sale_amount > 0 && (!lead.sale_amount || lead.sale_amount === 0)
          ? existing.sale_amount
          : lead.sale_amount ?? existing.sale_amount,
      purchase_sent: existing.purchase_sent || lead.purchase_sent,
      purchase_meta_status:
        existing.purchase_meta_status !== 'none'
          ? existing.purchase_meta_status
          : lead.purchase_meta_status,
      purchase_response_id: existing.purchase_response_id || lead.purchase_response_id,
      ctwa_clid: lead.is_organic ? undefined : (lead.ctwa_clid || existing.ctwa_clid),
      updated_at: new Date().toISOString(),
    };

    if (lead.is_organic) {
      delete leads[index].campaign_id;
      delete leads[index].campaign_name;
      delete leads[index].ad_name;
      delete leads[index].ctwa_clid;
      leads[index].is_organic = true;
      leads[index].platform = 'organic';
      leads[index].lead_submitted_sent = false;
    }
  } else {
    leads.unshift(lead);
  }

  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (e) {
    console.error('[LeadsStorage] Error writing leads file:', e);
  }

  return leads[index >= 0 ? index : 0];
}

export function getStoredMessages(): Record<string, Message[]> {
  ensureDataDir();
  if (!fs.existsSync(MESSAGES_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[LeadsStorage] Error reading messages file:', e);
    return {};
  }
}

export function saveMessage(leadId: string, message: Message): void {
  ensureDataDir();
  const allMessages = getStoredMessages();
  if (!allMessages[leadId]) {
    allMessages[leadId] = [];
  }

  // Avoid duplicates by id
  if (!allMessages[leadId].some((m) => m.id === message.id)) {
    allMessages[leadId].push(message);
    try {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(allMessages, null, 2), 'utf-8');
    } catch (e) {
      console.error('[LeadsStorage] Error writing messages file:', e);
    }
  }
}

/**
 * Syncs recent messages from Evolution API for an instance,
 * automatically creating leads for new WhatsApp contacts and detecting Meta CTWA referrals.
 */
export async function syncEvolutionRecentMessages(
  instanceName: string = 'Carlos1',
  companyId: string = 'comp_pedagogicos'
): Promise<{ addedLeads: Lead[]; totalFound: number }> {
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://prospeccao-evolution01.pesd8y.easypanel.host';
  const evolutionKey = process.env.EVOLUTION_API_KEY || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD';

  const configuredInstance = initialWhatsAppInstances[companyId];
  // Prefer the instance configured for the tenant over a stale client value.
  const targetInstance = configuredInstance?.instance_name || instanceName;
  const ownPhone = configuredInstance?.phone_number;

  const addedLeads: Lead[] = [];

  try {
    // 1. Fetch from findChats to capture individual conversations
    const chatsRes = await fetch(`${evolutionUrl}/chat/findChats/${targetInstance}`, {
      method: 'POST',
      headers: {
        apikey: evolutionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    let chatsList: any[] = [];
    if (chatsRes.ok) {
      const data = await chatsRes.json();
      chatsList = Array.isArray(data) ? data : [];
    }

    // Filter to direct chats (exclude broadcast groups ending in @g.us)
    const directChats = chatsList.filter((c) => c.remoteJid && !c.remoteJid.endsWith('@g.us'));

    const existingLeads = getStoredLeads();
    const companyMeta = getCompanyMetaIntegration(companyId);
    const isPedagogicos = companyId === 'comp_pedagogicos';

    for (const chat of directChats) {
      const lm = chat.lastMessage;
      const key = lm?.key;

      const remoteJidAlt = key?.remoteJidAlt;
      const jidToUse =
        remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')
          ? remoteJidAlt
          : chat.remoteJid || key?.remoteJid || '';

      if (jidToUse.includes('@g.us')) continue;

      const rawPhone = jidToUse.split('@')[0].replace(/\D/g, '');
      const lidJid =
        chat.remoteJid?.includes('@lid')
          ? chat.remoteJid
          : key?.remoteJid?.includes('@lid')
          ? key.remoteJid
          : '';
      const lid = lidJid ? lidJid.split('@')[0].replace(/\D/g, '') : undefined;
      if (!rawPhone || rawPhone.length < 8) continue;
      if (rawPhone === ownPhone || rawPhone === '556282002147') continue; // Skip own instance phone

      const pushName = lm?.pushName || chat.pushName || 'Lead WhatsApp';
      const messageContent =
        lm?.message?.conversation ||
        lm?.message?.extendedTextMessage?.text ||
        lm?.message?.imageMessage?.caption ||
        'Mensagem recebida pelo WhatsApp';

      // CTWA Detection - Only consider Meta Ads if verified conversionSource or ctwaClid is present
      const contextInfo =
        lm?.contextInfo ||
        lm?.message?.extendedTextMessage?.contextInfo ||
        lm?.message?.conversation?.contextInfo ||
        lm?.message?.imageMessage?.contextInfo;

      const ctwaPayload =
        contextInfo?.externalAdReply?.ctwaClid ||
        contextInfo?.externalAdReply?.ctwa_clid ||
        contextInfo?.ctwaPayload ||
        contextInfo?.conversionData;

      const isFBAds =
        contextInfo?.conversionSource === 'FB_Ads' ||
        Boolean(ctwaPayload);

      // The CRM is the WhatsApp conversation inbox. New direct conversations
      // must be visible even when Evolution does not preserve the ad metadata.

      const platform =
        contextInfo?.entryPointConversionApp ||
        contextInfo?.externalAdReply?.sourceApp ||
        (isFBAds ? 'instagram' : 'organic');

      const sourceId =
        contextInfo?.externalAdReply?.sourceID ||
        contextInfo?.externalAdReply?.sourceId ||
        contextInfo?.externalAdReply?.source_id;

      let adDetails = null;
      if (sourceId && companyMeta?.access_token) {
        try {
          adDetails = await MetaGraphApiService.getAdDetails(sourceId, companyMeta.access_token);
        } catch (e) {}
      }

      // Tenant-specific defaults: never label an Amadeus lead with the
      // Pedagógicos campaign/pixel just because the Meta lookup failed.
      const campaignName =
        adDetails?.campaignName || (isPedagogicos ? '[Eng] [Jogo da Memória das Silabas] [10.11]' : undefined);
      const campaignId =
        adDetails?.campaignId || (isFBAds && isPedagogicos ? '120250535297470101' : undefined);
      const adsetName = adDetails?.adsetName || (isFBAds && isPedagogicos ? '[25-40] [Mulheres]' : undefined);
      const adsetId = adDetails?.adsetId;
      const adTitle = contextInfo?.externalAdReply?.title;
      const adName =
        adDetails?.adName ||
        (isPedagogicos ? (adTitle ? `${adTitle} - Jogo da Memória` : '01 - Jogo da Memória das Sílabas') : adTitle);
      const adId = adDetails?.adId || sourceId;
      const pixelId = adDetails?.pixelId || companyMeta?.pixel_id;
      const pageId = adDetails?.pageId || companyMeta?.page_id;

      const msgTime = lm?.messageTimestamp
        ? new Date(lm.messageTimestamp * 1000).toISOString()
        : chat.updatedAt || new Date().toISOString();

      // Check if lead already exists for this tenant only
      const existing = existingLeads.find(
        (l) =>
          l.company_id === companyId &&
          (l.phone === rawPhone ||
            (lid && l.lid === lid) ||
            (l.id && l.id.includes(rawPhone)))
      );

      if (!existing) {
        const leadId = `lead_wa_${rawPhone}_${lm?.id || Date.now()}`;
        const newLead: Lead = {
          id: leadId,
          company_id: companyId,
          stage_id: 'stage_1',
          name: (pushName && pushName !== 'Você') ? pushName : `Lead ${rawPhone.slice(-4)}`,
          phone: rawPhone,
          lid,
          is_organic: !isFBAds,
          ctwa_clid: ctwaPayload || undefined,
          source_id: sourceId || undefined,
          platform: isFBAds ? (platform === 'facebook' ? 'facebook' : 'instagram') : 'organic',
          campaign_id: isFBAds ? campaignId : undefined,
          campaign_name: isFBAds ? campaignName : undefined,
          adset_id: adsetId,
          adset_name: adsetName,
          ad_id: adId,
          ad_name: isFBAds ? adName : undefined,
          pixel_id: pixelId,
          page_id: pageId,
          product_name: isPedagogicos ? 'Jogo da Memória das Sílabas' : undefined,
          lead_submitted_sent: false,
          sale_amount: 0,
          currency: 'BRL',
          sale_status: 'none',
          purchase_sent: false,
          purchase_meta_status: 'none',
          first_message_at: msgTime,
          last_interaction_at: msgTime,
          created_at: msgTime,
          updated_at: new Date().toISOString(),
        };

        // Historical sync only backfills the CRM. Conversions are dispatched
        // by the real-time webhook to avoid sending a burst of old events to
        // Meta with the current timestamp.
        saveLead(newLead);
        addedLeads.push(newLead);
      } else {
        // Update existing lead details if improved (e.g. ctwa_clid found, newer interaction)
        let updated = false;

        // Improve name if previously 'Você' or generic
        if ((!existing.name || existing.name === 'Você' || existing.name === 'Lead WhatsApp') && pushName && pushName !== 'Você') {
          existing.name = pushName;
          updated = true;
        }

        if (lid && !existing.lid) {
          existing.lid = lid;
          updated = true;
        }

        // Attach/refresh CTWA metadata even for leads created by an earlier
        // sync that did not have Meta credentials available yet.
        if (isFBAds) {
          if (!existing.ctwa_clid && ctwaPayload) existing.ctwa_clid = ctwaPayload;
          existing.source_id = sourceId || existing.source_id;
          existing.is_organic = false;
          existing.platform = platform === 'facebook' ? 'facebook' : 'instagram';
          updated = true;
        }

        if (adDetails) {
          existing.campaign_id = adDetails.campaignId || existing.campaign_id;
          existing.campaign_name = adDetails.campaignName || existing.campaign_name;
          existing.adset_id = adDetails.adsetId || existing.adset_id;
          existing.adset_name = adDetails.adsetName || existing.adset_name;
          existing.ad_id = adDetails.adId || existing.ad_id;
          existing.ad_name = adDetails.adName || existing.ad_name;
          if (adDetails.pixelId) existing.pixel_id = adDetails.pixelId;
          if (adDetails.pageId) existing.page_id = adDetails.pageId;
          updated = true;
        }

        if (!existing.pixel_id && companyMeta?.pixel_id) {
          existing.pixel_id = companyMeta.pixel_id;
          updated = true;
        }
        if (!existing.page_id && companyMeta?.page_id) {
          existing.page_id = companyMeta.page_id;
          updated = true;
        }

        if (msgTime > (existing.last_interaction_at || '')) {
          existing.last_interaction_at = msgTime;
          updated = true;
        }

        if (updated) {
          saveLead(existing);
        }
      }

      // Save message
      const leadId = existing ? existing.id : `lead_wa_${rawPhone}_${lm?.id || Date.now()}`;
      const msgId = lm?.id || key?.id || `msg_${Date.now()}_${Math.random()}`;
      const newMsg: Message = {
        id: msgId,
        company_id: companyId,
        conversation_id: `conv_${leadId}`,
        lead_id: leadId,
        sender_type: key?.fromMe ? 'agent' : 'lead',
        message_id: msgId,
        content: messageContent,
        status: 'delivered',
        is_from_me: Boolean(key?.fromMe),
        created_at: msgTime,
      };
      saveMessage(leadId, newMsg);
    }

    return { addedLeads, totalFound: directChats.length };
  } catch (error) {
    console.error('[LeadsStorage] Error syncing messages:', error);
    return { addedLeads: [], totalFound: 0 };
  }
}
