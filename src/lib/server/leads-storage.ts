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
    leads[index] = {
      ...leads[index],
      ...lead,
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

  return lead;
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
    const res = await fetch(`${evolutionUrl}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: {
        apikey: evolutionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        where: {
          key: {
            fromMe: false,
          },
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[LeadsStorage] Evolution fetch messages failed with status ${res.status}`);
      return { addedLeads: [], totalFound: 0 };
    }

    const json = await res.json();
    const records: any[] = json.messages?.records || json.records || (Array.isArray(json) ? json : []);

    const existingLeads = getStoredLeads();

    for (const record of records) {
      const key = record.key;
      if (key?.fromMe) continue;

      // Extract real phone from remoteJidAlt (for @lid privacy addressing) or remoteJid
      const remoteJidAlt = key?.remoteJidAlt;
      const jidToUse =
        remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')
          ? remoteJidAlt
          : key?.remoteJid || '';

      if (jidToUse.includes('@g.us')) continue; // skip group chats

      const rawPhone = jidToUse.split('@')[0].replace(/\D/g, '');
      if (!rawPhone || rawPhone.length < 8) continue;

      const pushName = record.pushName || 'Lead WhatsApp';
      const messageContent =
        record.message?.conversation ||
        record.message?.extendedTextMessage?.text ||
        'Mensagem recebida pelo WhatsApp';

      // CTWA Detection
      const contextInfo =
        record.contextInfo ||
        record.message?.extendedTextMessage?.contextInfo;

      const isFBAds =
        contextInfo?.conversionSource === 'FB_Ads' ||
        Boolean(contextInfo?.ctwaPayload) ||
        Boolean(contextInfo?.conversionData) ||
        Boolean(contextInfo?.externalAdReply);

      const ctwaPayload =
        contextInfo?.ctwaPayload ||
        contextInfo?.conversionData ||
        contextInfo?.externalAdReply?.ctwaClid ||
        contextInfo?.externalAdReply?.referralParam;

      // Check if lead already exists
      const existing = existingLeads.find((l) => l.phone === rawPhone);
      const leadId = existing ? existing.id : `lead_wa_${rawPhone}_${record.id || Date.now()}`;

      if (!existing) {
        const newLead: Lead = {
          id: leadId,
          company_id: companyId,
          stage_id: 'stage_new',
          name: pushName,
          phone: rawPhone,
          is_organic: !isFBAds,
          ctwa_clid: ctwaPayload,
          platform: isFBAds ? 'facebook' : 'organic',
          campaign_name: isFBAds ? 'Campanha Meta Ads • Projeto Saber+' : undefined,
          ad_name: isFBAds ? 'Jogo da Memória das Sílabas' : undefined,
          lead_submitted_sent: false,
          sale_amount: 0,
          currency: 'BRL',
          sale_status: 'none',
          purchase_sent: false,
          purchase_meta_status: 'none',
          first_message_at: new Date(
            (record.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000
          ).toISOString(),
          last_interaction_at: new Date(
            (record.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000
          ).toISOString(),
          created_at: new Date(
            (record.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000
          ).toISOString(),
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
      }

      // Save message
      const msgId = record.id || key?.id || `msg_${Date.now()}_${Math.random()}`;
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
        created_at: new Date(
          (record.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000
        ).toISOString(),
      };
      saveMessage(leadId, newMsg);
    }

    return { addedLeads, totalFound: records.length };
  } catch (error) {
    console.error('[LeadsStorage] Error syncing messages:', error);
    return { addedLeads: [], totalFound: 0 };
  }
}
