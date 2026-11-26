import crypto from 'crypto';

/**
 * SHA-256 helper for Meta Conversions API user_data.ph
 */
export function sha256(value: string): string {
  if (!value) return '';
  const cleaned = String(value).trim().toLowerCase();
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

/**
 * Extracts and parses monetary values from text.
 * Matches the logic from the n8n WhatsTracker workflow.
 */
export function parseMoney(input: unknown): number {
  if (input === null || input === undefined) return 0;

  let s = String(input).trim();
  s = s.replace(/R\$\s*/gi, '').replace(/\s+/g, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // BR: 120.000,50
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 120,000.50
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    // 40,00
    s = s.replace(',', '.');
  } else if (hasDot) {
    if (!/\.\d{1,2}$/.test(s)) {
      // milhar
      s = s.replace(/\./g, '');
    }
  }

  s = s.replace(/[^0-9.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Extracts all money values from message text.
 * Enhanced implementation of the WhatsTracker money extraction logic.
 */
export function extractMoneyValues(text: string): number[] {
  if (!text) return [];
  const values: number[] = [];

  // Match expressions like: R$ 5,00, R$5,00, R$ 120.000,50, R$ 5, Valor: 5,00, Total: 197,00, Preço: 5,00
  const matches = text.match(/(?:R\$\s*|\bvalor\s*:\s*|\btotal\s*:\s*|\bpre[çc]o\s*:\s*)(\d[\d.,]*)/gi) || [];
  for (const m of matches) {
    const numPart = m.replace(/(?:R\$|valor\s*:|total\s*:|pre[çc]o\s*:)/gi, '').trim();
    const parsed = parseMoney(numPart);
    if (parsed > 0 && parsed < 10000000) {
      // Exclude phone numbers or PIX keys masquerading as values
      if (numPart.replace(/\D/g, '').length <= 8) {
        values.push(parsed);
      }
    }
  }

  // Also check lines that are purely numbers or R$ numbers
  const lines = text.replace(/\r/g, '').split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (/^(?:R\$\s*)?\d+(?:[.,]\d{1,2})?$/i.test(line)) {
      const parsed = parseMoney(line);
      if (parsed > 0 && !values.includes(parsed)) {
        values.push(parsed);
      }
    }
  }

  return values;
}

export interface ExtractedDatasetAndPage {
  nome_campanha: string;
  id_campanha: string;
  nome_conjunto: string;
  id_conjunto: string;
  nome_anuncio: string;
  id_anuncio: string;
  pixel_id: string[];
  page_id: string[];
}

/**
 * Automatically searches for dataset / fb_pixel and page IDs recursively in Meta Graph API response.
 * Exact algorithm from n8n WhatsTracker node "Extrair ID pixel e page_id automaticamente".
 */
export function findDatasetAndPage(jsonObj: any): ExtractedDatasetAndPage {
  const result: ExtractedDatasetAndPage = {
    nome_campanha: jsonObj?.campaign?.name || '',
    id_campanha: jsonObj?.campaign?.id || '',
    nome_conjunto: jsonObj?.adset?.name || '',
    id_conjunto: jsonObj?.adset?.id || '',
    nome_anuncio: jsonObj?.name || '',
    id_anuncio: jsonObj?.id || '',
    pixel_id: [],
    page_id: [],
  };

  function searchInObject(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    // Se for array, percorre cada item
    if (Array.isArray(obj)) {
      obj.forEach(searchInObject);
      return;
    }

    // Coleta dataset ou fallback fb_pixel
    if (obj.dataset && Array.isArray(obj.dataset)) {
      result.pixel_id.push(...obj.dataset.map(String));
    } else if (obj.fb_pixel && Array.isArray(obj.fb_pixel)) {
      result.pixel_id.push(...obj.fb_pixel.map(String));
    }

    // Coleta page
    if (obj.page && Array.isArray(obj.page)) {
      result.page_id.push(...obj.page.map(String));
    }

    // Percorre recursivamente
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        searchInObject(obj[key]);
      }
    }
  }

  searchInObject(jsonObj);

  // Remove duplicados
  result.pixel_id = [...new Set(result.pixel_id.filter(Boolean))];
  result.page_id = [...new Set(result.page_id.filter(Boolean))];

  return result;
}

export interface MappedWebhookData {
  telefone: string;
  lid: string;
  ctwaclid?: string;
  source_id?: string;
  first_name: string;
  last_name: string;
  plataforma: string;
  fromme: boolean;
  mensagem: string;
  rawPushName: string;
}

/**
 * Normalizes incoming webhook from both Evolution Go and Evolution API v1/v2.
 * Matches the logic in the n8n "DADOS MAPEADOS" node.
 */
export function mapEvolutionWebhook(body: any): MappedWebhookData {
  const data = body?.data || body;
  const info = data?.Info || {};
  const messageData = data?.Message || data?.message || {};
  const key = data?.key || messageData?.key || {};

  // fromme
  const fromme = Boolean(info?.IsFromMe ?? key?.fromMe ?? false);

  // Telefone logic from n8n:
  // Info.IsFromMe ? (Info.RecipientAlt || Info.Chat) : (Info.Sender.includes('@lid') ? (Info.SenderAlt || Info.Sender) : Info.Sender)
  let rawPhoneJid = '';
  if (info && (info.Sender || info.Chat || info.RecipientAlt)) {
    if (fromme) {
      rawPhoneJid = info.RecipientAlt || info.Chat || '';
    } else {
      if (info.Sender?.includes('@lid')) {
        rawPhoneJid = info.SenderAlt || info.Sender || '';
      } else {
        rawPhoneJid = info.Sender || '';
      }
    }
  }

  // Fallback to standard Evolution API key.remoteJid / remoteJidAlt
  if (!rawPhoneJid || rawPhoneJid.includes('@lid')) {
    const remoteJidAlt = key?.remoteJidAlt;
    const remoteJid = key?.remoteJid || data?.remoteJid || '';
    if (remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')) {
      rawPhoneJid = remoteJidAlt;
    } else if (remoteJid && remoteJid.includes('@s.whatsapp.net')) {
      rawPhoneJid = remoteJid;
    } else if (remoteJidAlt) {
      rawPhoneJid = remoteJidAlt;
    } else {
      rawPhoneJid = remoteJid;
    }
  }

  const telefone = rawPhoneJid.split('@')[0].replace(/\D/g, '');

  // LID logic from n8n:
  // Info.Chat.includes('@lid') ? Info.Chat : (Info.ChatAlt || Info.Chat)
  let rawLidJid = '';
  if (info && (info.Chat || info.ChatAlt)) {
    if (info.Chat?.includes('@lid')) {
      rawLidJid = info.Chat;
    } else if (info.ChatAlt?.includes('@lid')) {
      rawLidJid = info.ChatAlt;
    }
  }
  if (!rawLidJid) {
    if (key?.remoteJid?.includes('@lid')) rawLidJid = key.remoteJid;
    else if (data?.remoteJid?.includes('@lid')) rawLidJid = data.remoteJid;
  }
  const lid = rawLidJid ? rawLidJid.split('@')[0].replace(/\D/g, '') : '';

  // ContextInfo / externalAdReply
  const contextInfo =
    messageData?.extendedTextMessage?.contextInfo ||
    data?.SourceWebMsg?.message?.extendedTextMessage?.contextInfo ||
    data?.SourceWebMsg?.message?.imageMessage?.contextInfo ||
    data?.context?.Info?.ContextInfo ||
    data?.contextInfo ||
    messageData?.contextInfo;

  const externalAdReply = contextInfo?.externalAdReply;

  // ctwaclid
  const ctwaclid =
    externalAdReply?.ctwaClid ||
    externalAdReply?.ctwa_clid ||
    contextInfo?.ctwaClid ||
    contextInfo?.ctwaPayload ||
    contextInfo?.conversionData ||
    undefined;

  // source_id
  const source_id =
    externalAdReply?.sourceID ||
    externalAdReply?.sourceId ||
    externalAdReply?.source_id ||
    contextInfo?.externalAdReply?.sourceID ||
    contextInfo?.externalAdReply?.sourceId ||
    undefined;

  // pushName & first_name / last_name
  const pushName = (info?.PushName || data?.pushName || '').trim();
  const first_name = pushName ? pushName.split(' ')[0] : 'Sem';
  const last_name = pushName ? pushName.split(' ').slice(-1)[0] : 'Nome';

  // plataforma
  const plataforma =
    externalAdReply?.sourceApp ||
    contextInfo?.entryPointConversionApp ||
    contextInfo?.sourceApp ||
    'instagram';

  // mensagem
  const mensagem =
    data?.SourceWebMsg?.message?.extendedTextMessage?.text ??
    messageData?.extendedTextMessage?.text ??
    data?.SourceWebMsg?.message?.conversation ??
    messageData?.conversation ??
    '';

  return {
    telefone,
    lid,
    ctwaclid: ctwaclid ? String(ctwaclid) : undefined,
    source_id: source_id ? String(source_id) : undefined,
    first_name,
    last_name,
    plataforma,
    fromme,
    mensagem: String(mensagem || ''),
    rawPushName: pushName,
  };
}
