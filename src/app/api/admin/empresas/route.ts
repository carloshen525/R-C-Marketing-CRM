import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initialCompanies } from '@/lib/initial-data';
import { Company } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
  }
}

function getStoredCompanies(): Company[] {
  ensureDataDir();
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        // Ensure initial standard companies are present
        const merged = [...data];
        for (const initC of initialCompanies) {
          if (!merged.some((c) => c.id === initC.id)) {
            merged.push(initC);
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('[Empresas API] Error reading companies file:', e);
  }
  return initialCompanies;
}

function saveStoredCompanies(companies: Company[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Empresas API] Error saving companies file:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const companies = getStoredCompanies();
    return NextResponse.json({
      status: 'ok',
      companies,
      total: companies.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao carregar empresas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'ID da empresa é obrigatório' }, { status: 400 });
    }

    const companies = getStoredCompanies();
    const idx = companies.findIndex((c) => c.id === body.id);
    if (idx >= 0) {
      companies[idx] = {
        ...companies[idx],
        ...body,
        updated_at: new Date().toISOString(),
      };
    } else {
      companies.unshift({
        ...body,
        created_at: body.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    saveStoredCompanies(companies);
    return NextResponse.json({ status: 'saved', company: body, companies });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao salvar empresa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID da empresa é obrigatório' }, { status: 400 });
    }

    const companies = getStoredCompanies().filter((c) => c.id !== id);
    saveStoredCompanies(companies);
    return NextResponse.json({ status: 'deleted', id, companies });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao deletar empresa' }, { status: 500 });
  }
}
