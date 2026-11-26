import { NextRequest, NextResponse } from 'next/server';
import { syncEvolutionRecentMessages, getStoredLeads } from '@/lib/server/leads-storage';
import { resolveCompanyIdFromInstance } from '@/lib/server/tenant-resolver';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const instance = body.instance;
    const companyId = body.company_id || resolveCompanyIdFromInstance(instance);

    if (!instance || !companyId) {
      return NextResponse.json(
        { error: 'Instância não informada ou não vinculada a nenhuma empresa.' },
        { status: 400 }
      );
    }

    const result = await syncEvolutionRecentMessages(instance, companyId);
    const leads = getStoredLeads();

    return NextResponse.json({
      status: 'synced',
      instance,
      addedCount: result.addedLeads.length,
      addedLeads: result.addedLeads,
      totalLeads: leads.length,
      allLeads: leads,
    });
  } catch (error) {
    console.error('[API Leads Sync] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
