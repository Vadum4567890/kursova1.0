import { fetchJson, internalHeaders } from './serviceHttp';

function displayNameFromUserPayload(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const u = data as Record<string, unknown>;
  const topFull = String(u.fullName ?? u.username ?? '').trim();
  if (topFull) return topFull;
  const profile = u.profile;
  if (profile && typeof profile === 'object') {
    const p = profile as Record<string, unknown>;
    const first = String(p.firstName ?? '').trim();
    const last = String(p.lastName ?? '').trim();
    const joined = [first, last].filter(Boolean).join(' ').trim();
    if (joined) return joined;
  }
  const email = String(u.email ?? '').trim();
  return email || null;
}

/**
 * Resolve renter display name via user-service (avoid depending on api-gateway startup order).
 */
export async function fetchUserDisplayName(userId: string): Promise<string | null> {
  const users = process.env.USER_SERVICE_URL || 'http://localhost:3002';
  const gateway = process.env.API_GATEWAY_URL || process.env.GATEWAY_URL;
  const urls = [
    `${users.replace(/\/$/, '')}/api/users/${userId}`,
    ...(gateway ? [`${gateway.replace(/\/$/, '')}/api/users/${userId}`] : []),
  ];

  for (const url of urls) {
    try {
      const body = await fetchJson<{ status?: string; success?: boolean; data?: unknown }>(url, {
        headers: internalHeaders(),
      });
      const data = body?.data;
      const name = displayNameFromUserPayload(data);
      if (name) return name;
    } catch {
      /* try next */
    }
  }
  return null;
}
