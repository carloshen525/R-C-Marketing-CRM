import crypto from 'crypto';

/**
 * Normalizes and hashes strings with SHA-256 as required by Meta Conversions API
 */
export function sha256(value: string): string {
  if (!value) return '';
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

/**
 * Normalizes phone numbers to Meta CAPI standard:
 * E.164 without '+' or leading zeros, digits only.
 * E.g., "(11) 98765-4321" in Brazil -> "5511987654321" -> SHA-256
 */
export function normalizeAndHashPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  
  // If Brazilian number without country code 55 (10 or 11 digits)
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  
  return sha256(digits);
}

/**
 * Normalizes name into first and last name hashes
 */
export function normalizeAndHashName(fullName: string): { fn?: string; ln?: string } {
  if (!fullName) return {};
  const parts = fullName.trim().split(/\s+/);
  const fn = parts[0] ? sha256(parts[0]) : undefined;
  const ln = parts.length > 1 ? sha256(parts.slice(1).join(' ')) : undefined;
  return { fn, ln };
}

export function normalizeAndHashEmail(email?: string): string | undefined {
  if (!email) return undefined;
  return sha256(email);
}
