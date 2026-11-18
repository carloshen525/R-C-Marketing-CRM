import fs from 'fs';
import path from 'path';
import { Lead, Message } from '../types';
import { MetaConversionsService } from '../meta/conversions-api.service';

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
      ctwa_clid: lead.ctwa_clid || existing.ctwa_clid,
      updated_at: new Date().toISOString(),
    };
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

  const addedLeads: Lead[] = [];

  try {
    // 1. Fetch from findChats to capture individual conversations
    const chatsRes = await fetch(`${evolutionUrl}/chat/findChats/${instanceName}`, {
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
      if (!rawPhone || rawPhone.length < 8) continue;
      if (rawPhone === '556282002147') continue; // Skip own instance phone

      const pushName = lm?.pushName || chat.pushName || 'Lead WhatsApp';
      const messageContent =
        lm?.message?.conversation ||
        lm?.message?.extendedTextMessage?.text ||
        lm?.message?.imageMessage?.caption ||
        'Mensagem recebida pelo WhatsApp';

      // CTWA Detection
      const contextInfo =
        lm?.contextInfo ||
        lm?.message?.extendedTextMessage?.contextInfo ||
        lm?.message?.imageMessage?.contextInfo;

      const isFBAds =
        contextInfo?.conversionSource === 'FB_Ads' ||
        Boolean(contextInfo?.ctwaPayload) ||
        Boolean(contextInfo?.conversionData) ||
        Boolean(contextInfo?.externalAdReply) ||
        Boolean(messageContent && (messageContent.includes('Sílabas') || messageContent.includes('Silabas') || messageContent.includes('Jogo da Memória')));

      // Filter relevant leads for this pedagogical tenant
      const isPedagogical =
        isFBAds ||
        Boolean(messageContent && (messageContent.includes('material') || messageContent.includes('PIX') || messageContent.includes('arquivo') || messageContent.includes('pedagogico')));

      if (!isPedagogical && !isFBAds) {
        continue;
      }

      const ctwaPayload =
        contextInfo?.externalAdReply?.ctwaClid ||
        contextInfo?.ctwaPayload ||
        contextInfo?.conversionData;

      const platform =
        contextInfo?.entryPointConversionApp ||
        contextInfo?.externalAdReply?.sourceApp ||
        (isFBAds ? 'instagram' : 'organic');

      const adTitle = contextInfo?.externalAdReply?.title;
      const adName = adTitle ? `${adTitle} - Jogo da Memória` : '01 - Jogo da Memória das Sílabas';
      const campaignName = '[Eng] [Jogo da Memória das Silabas] [10.11]';

      const msgTime = lm?.messageTimestamp
        ? new Date(lm.messageTimestamp * 1000).toISOString()
        : chat.updatedAt || new Date().toISOString();

      // Check if lead already exists
      const existing = existingLeads.find((l) => l.phone === rawPhone || (l.id && l.id.includes(rawPhone)));

      if (!existing) {
        const leadId = `lead_wa_${rawPhone}_${lm?.id || Date.now()}`;
        const newLead: Lead = {
          id: leadId,
          company_id: companyId,
          stage_id: 'stage_1',
          name: pushName,
          phone: rawPhone,
          is_organic: !isFBAds,
          ctwa_clid: ctwaPayload || undefined,
          platform: platform === 'instagram' ? 'instagram' : platform === 'facebook' ? 'facebook' : 'organic',
          campaign_id: isFBAds ? '120250535297470101' : undefined,
          campaign_name: isFBAds ? campaignName : undefined,
          ad_name: isFBAds ? adName : undefined,
          product_name: 'Jogo da Memória das Sílabas',
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

        // Dispatch Meta CAPI LeadSubmitted if CTWA
        if (isFBAds && ctwaPayload) {
          try {
            const capiRes = await MetaConversionsService.sendLeadSubmitted(newLead);
            if (capiRes.success) {
              newLead.lead_submitted_sent = true;
              newLead.lead_submitted_at = new Date().toISOString();
              newLead.lead_submitted_response_id = capiRes.fbtraceId || capiRes.responseId;
            }
          } catch (e) {
            console.error('[LeadsStorage] Failed to send CAPI for synced lead:', e);
          }
        }

        saveLead(newLead);
        addedLeads.push(newLead);
      } else {
        // Update existing lead details if improved (e.g. ctwa_clid found, newer interaction)
        let updated = false;
        if (!existing.ctwa_clid && ctwaPayload) {
          existing.ctwa_clid = ctwaPayload;
          existing.is_organic = false;
          existing.platform = platform === 'instagram' ? 'instagram' : 'facebook';
          existing.campaign_name = campaignName;
          existing.ad_name = adName;
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
