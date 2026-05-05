import crypto from 'crypto';

/**
 * Ключ для internal-only HTTP викликів між сервісами.
 * У production має бути заданий явний довгий ключ у SERVICE_API_KEY.
 */
export function getExpectedServiceKey(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SERVICE_API_KEY || '';
  }
  return process.env.SERVICE_API_KEY || 'internal-service-key';
}

/** Constant-time порівняння, щоб ускладнити brute-force по префіксу ключа. */
export function isValidServiceKey(headerKey: string | undefined): boolean {
  const expected = getExpectedServiceKey();
  if (!expected || headerKey === undefined) return false;
  try {
    const a = Buffer.from(headerKey, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
