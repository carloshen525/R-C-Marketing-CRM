import { NextRequest, NextResponse } from 'next/server';
import { initialWhatsAppInstances } from '@/lib/initial-data';
import { getStoredLeads } from '@/lib/server/leads-storage';

interface ContactItem {
  id: string;
  jid: string;
  phone: string;
  lid?: string;
  name: string;
  isGroup: boolean;
  lastMessage: string;
  lastMessageAt: string;
  fromMe: boolean;
  platform: 'instagram' | 'facebook' | 'organic';
  isAd: boolean;
  adTitle?: string;
  ctwaClid?: string;
  sourceId?: string;
  avatarUrl?: string;
  inCrm: boolean;
  leadId?: string;
  stageId?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeText(value: unknown, max = 180): string {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function toIsoDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const numeric = Number(value);
    const ms = numeric > 10_000_000_000 ? numeric : numeric * 1000;
    return new Date(ms).toISOString();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function extractPhone(
  jid: string,
  key?: Record<string, unknown>
): { phone: string; lid?: string } {
  const rawJid = String(jid || '');
  const rawLid = rawJid.includes('@lid') ? rawJid : '';
  const altJid = key?.remoteJidAlt || key?.senderPn || '';

  const preferred = String(altJid).includes('@s.whatsapp.net')
    ? String(altJid)
    : rawJid.includes('@s.whatsapp.net')
    ? rawJid
    : altJid || rawJid;

  return {
    phone: String(preferred).split('@')[0].replace(/\D/g, ''),
    lid: rawLid ? rawLid.split('@')[0].replace(/\D/g, '') : undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id') || '';
    const requestedInstance = searchParams.get('instance') || '';

    const canonicalInstance = initialWhatsAppInstances[companyId]?.instance_name;
    const instance = canonicalInstance || requestedInstance;

    if (!companyId || !instance) {
      return NextResponse.json(
        { error: 'company_id/instance não informados ou empresa sem instância configurada.' },
        { status: 400 }
      );
    }

    const evolutionUrl = (
      process.env.EVOLUTION_API_URL || 'https://prospeccao-evolution01.pesd8y.easypanel.host'
    ).replace(/\/+$/, '');
    const evolutionKey =
      process.env.EVOLUTION_API_KEY || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD';

    const response = await fetch(`${evolutionUrl}/chat/findChats/${encodeURIComponent(instance)}`, {
      method: 'POST',
      headers: {
        apikey: evolutionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return NextResponse.json(
        {
          error: `Evolution API retornou ${response.status} para a instância ${instance}.`,
          detail: detail.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const dataRecord = asRecord(data);
    const chats: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray(dataRecord.chats)
      ? dataRecord.chats
      : [];

    const companyLeads = getStoredLeads().filter((lead) => lead.company_id === companyId);

    const contacts: ContactItem[] = [];
    const groups: ContactItem[] = [];

    for (const rawChat of chats) {
      const chat = asRecord(rawChat);
      const jid = String(chat.remoteJid || chat.id || '');
      if (!jid) continue;

      const last = asRecord(chat.lastMessage);
      const key = asRecord(last.key);
      const message = asRecord(last.message);
      const extended = asRecord(message.extendedTextMessage);
      const image = asRecord(message.imageMessage);
      const video = asRecord(message.videoMessage);
      const conversation = asRecord(message.conversation);
      const isGroup = jid.endsWith('@g.us');
      const { phone, lid } = extractPhone(jid, key);

      const contextInfo = asRecord(
        last.contextInfo ||
          extended.contextInfo ||
          image.contextInfo ||
          video.contextInfo ||
          conversation.contextInfo
      );

      const externalAd = asRecord(contextInfo.externalAdReply);
      const ctwaClid =
        externalAd.ctwaClid ||
        externalAd.ctwa_clid ||
        contextInfo.ctwaClid ||
        contextInfo.ctwaPayload ||
        contextInfo.conversionData ||
        undefined;
      const sourceId =
        externalAd.sourceID || externalAd.sourceId || externalAd.source_id || undefined;
      const isAd =
        Boolean(ctwaClid) ||
        contextInfo.conversionSource === 'FB_Ads' ||
        Boolean(sourceId);

      const app = contextInfo.entryPointConversionApp || externalAd.sourceApp || '';
      const platform: ContactItem['platform'] =
        isAd && String(app).toLowerCase() === 'facebook'
          ? 'facebook'
          : isAd
          ? 'instagram'
          : 'organic';

      const lastMessageText =
        message.conversation || extended.text || image.caption || video.caption || '';

      const existingLead = companyLeads.find(
        (lead) =>
          (phone && lead.phone === phone) ||
          (lid && lead.lid === lid) ||
          (lead.id && phone && lead.id.includes(phone))
      );

      const item: ContactItem = {
        id: jid,
        jid,
        phone: phone || lid || '',
        lid,
        name:
          normalizeText(chat.pushName || last.pushName || '', 80) ||
          (isGroup ? 'Grupo sem nome' : `Contato ${phone.slice(-4)}`),
        isGroup,
        lastMessage: normalizeText(lastMessageText),
        lastMessageAt: toIsoDate(last.messageTimestamp || chat.updatedAt),
        fromMe: Boolean(key.fromMe),
        platform,
        isAd,
        adTitle: externalAd.title ? normalizeText(externalAd.title, 100) : undefined,
        ctwaClid: ctwaClid ? String(ctwaClid) : undefined,
        sourceId: sourceId ? String(sourceId) : undefined,
        avatarUrl:
          typeof chat.profilePicUrl === 'string'
            ? chat.profilePicUrl
            : typeof chat.profilePictureUrl === 'string'
            ? chat.profilePictureUrl
            : undefined,
        inCrm: Boolean(existingLead),
        leadId: existingLead?.id,
        stageId: existingLead?.stage_id,
      };

      if (isGroup) groups.push(item);
      else contacts.push(item);
    }

    contacts.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    groups.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

    return NextResponse.json({
      status: 'ok',
      companyId,
      instance,
      fetchedAt: new Date().toISOString(),
      totalChats: chats.length,
      directCount: contacts.length,
      groupCount: groups.length,
      adCount: contacts.filter((contact) => contact.isAd).length,
      inCrmCount: contacts.filter((contact) => contact.inCrm).length,
      contacts,
      groups,
    });
  } catch (error) {
    console.error('[API WhatsApp Contacts] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao buscar contatos na Evolution API.' },
      { status: 500 }
    );
  }
}
