import { v5 as uuidv5 } from 'uuid';

/** Той самий DNS namespace, що в rental-service / reporting-service auth. */
const LEGACY_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isNumericLike(value: string): boolean {
  return /^\d+$/.test(value);
}

/** Приводить id користувача з профілю до того ж вигляду, що в JWT / rental (legacy → uuid v5). */
export function canonicalUserId(userId: string | number): string {
  const raw = String(userId).trim();
  if (isUuidLike(raw)) return raw.toLowerCase();
  if (isNumericLike(raw)) return uuidv5(`legacy:${raw}`, LEGACY_ID_NAMESPACE).toLowerCase();
  return raw.toLowerCase();
}
