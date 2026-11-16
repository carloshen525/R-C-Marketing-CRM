import { NextRequest, NextResponse } from 'next/server';
import { getStoredLeads, saveLead, getStoredMessages, syncEvolutionRecentMessages } from '@/lib/server/leads-storage';
import { Lead } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sync = searchParams.get('sync') === 'true';
    const instance = searchParams.get('instance') || 'Carlos1';
    const companyId = searchParams.get('company_id') || 'comp_pedagogicos';

    if (sync) {
      await syncEvolutionRecentMessages(instance, companyId);
    }

    const leads = getStoredLeads();
    const messages = getStoredMessages();

    return NextResponse.json({
      status: 'ok',
      leads,
      messages,
      total: leads.length,
    });
  } catch (error) {
    console.error('[API Leads] GET error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    const saved = saveLead(body as Lead);
    return NextResponse.json({ status: 'saved', lead: saved });
  } catch (error) {
    console.error('[API Leads] POST error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
