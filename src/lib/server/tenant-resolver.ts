import fs from 'fs';
import path from 'path';
import { Company } from '../types';
import { initialCompanies, initialWhatsAppInstances } from '../initial-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');

/**
 * Known production instances whose name does not match the tenant subdomain.
 * Keys are normalized (lowercase, no punctuation/accents).
 */
const INSTANCE_COMPANY_ALIASES: Record<string, string> = {
  carlos1: 'comp_pedagogicos',
  amadeusinstitutodeartes: 'comp_amadeus',
};

function normalize(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getStoredCompanies(): Company[] {
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        const merged: Company[] = [...data];
        for (const initial of initialCompanies) {
          if (!merged.some((company) => company.id === initial.id)) {
            merged.push(initial);
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('[TenantResolver] Error reading companies file:', e);
  }
  return initialCompanies;
}

/**
 * Resolves which tenant (company_id) owns an Evolution API instance.
 * This is the single source of truth for routing webhook leads to the
 * correct CRM, instead of defaulting every instance to one tenant.
 */
export function resolveCompanyIdFromInstance(instanceName?: string | null): string | null {
  const normalizedInstance = normalize(instanceName || '');
  if (!normalizedInstance) return null;

  if (INSTANCE_COMPANY_ALIASES[normalizedInstance]) {
    return INSTANCE_COMPANY_ALIASES[normalizedInstance];
  }

  for (const [companyId, config] of Object.entries(initialWhatsAppInstances)) {
    const configuredName = normalize(config.instance_name);
    if (configuredName && configuredName === normalizedInstance) {
      return companyId;
    }
  }

  const companies = getStoredCompanies();
  for (const company of companies) {
    const candidates = [
      company.slug,
      company.subdomain,
      company.subdominio,
      company.name,
      company.trade_name,
      company.nome_empresa,
    ];

    for (const candidate of candidates) {
      const normalizedCandidate = normalize(candidate || '');
      if (!normalizedCandidate) continue;

      if (normalizedCandidate === normalizedInstance) {
        return company.id;
      }

      if (
        normalizedCandidate.length >= 4 &&
        normalizedInstance.includes(normalizedCandidate)
      ) {
        return company.id;
      }
    }
  }

  return null;
}
