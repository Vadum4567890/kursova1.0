const DEFAULT_TIMEOUT_MS = 5000;

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

export function internalHeaders(): Record<string, string> {
  const key =
    process.env.NODE_ENV === 'production'
      ? process.env.SERVICE_API_KEY || ''
      : process.env.SERVICE_API_KEY || 'internal-service-key';
  return { 'X-Service-Key': key };
}
