export function resolvePublicMediaUrl(url?: string | null): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  try {
    const parsed = new URL(raw, origin || 'http://localhost');
    const isAppMediaPath =
      parsed.pathname.startsWith('/api/upload/') || parsed.pathname.startsWith('/uploads/');

    if (isAppMediaPath && origin) {
      return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    return origin
      ? `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`
      : `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (!origin) return raw;
    return raw.startsWith('/') ? `${origin}${raw}` : `${origin}/${raw}`;
  }
}
