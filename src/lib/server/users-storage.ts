import fs from 'fs';
import path from 'path';
import { Profile } from '../types';
import { initialProfiles } from '../initial-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
  }
}

export function getStoredUsers(): Profile[] {
  ensureDataDir();
  const users: Profile[] = [...initialProfiles];

  // Load custom users from users.json
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        for (const u of data) {
          if (!users.some((existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
            users.push(u);
          }
        }
      }
    } catch (e) {
      console.error('[UsersStorage] Error reading users.json:', e);
    }
  }

  // Ensure each company in companies.json has a client_admin user
  if (fs.existsSync(COMPANIES_FILE)) {
    try {
      const companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8'));
      if (Array.isArray(companies)) {
        for (const c of companies) {
          if (!c.id) continue;
          const email = (c.email || '').toLowerCase().trim();
          if (!email || email === 'carloshenrq1245@gmail.com') continue;

          if (!users.some((u) => u.email.toLowerCase() === email)) {
            users.push({
              id: `user_${c.subdomain || c.id}_admin`,
              tenant_id: c.id,
              company_id: c.id,
              full_name: c.owner_name || c.name,
              email: c.email,
              role: 'client_admin',
              is_active: true,
              phone: c.phone || '',
              must_change_password: true,
              temporary_password: 'changeme123',
              created_at: c.created_at || new Date().toISOString(),
              updated_at: c.updated_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      console.error('[UsersStorage] Error checking companies.json for users:', e);
    }
  }

  return users;
}

export function saveUser(user: Profile): Profile {
  ensureDataDir();
  const users = getStoredUsers();
  const index = users.findIndex(
    (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
  );

  if (index >= 0) {
    users[index] = { ...users[index], ...user, updated_at: new Date().toISOString() };
  } else {
    users.push({ ...user, created_at: user.created_at || new Date().toISOString(), updated_at: new Date().toISOString() });
  }

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('[UsersStorage] Error writing users.json:', e);
  }

  return user;
}
