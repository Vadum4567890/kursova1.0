import type { IncomingMessage, ClientRequest } from 'http';
import type { Socket } from 'net';
import { Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

const isProduction = process.env.NODE_ENV === 'production';

/** Час очікування відповіді від апстріму (мс). 0 — без таймауту на outgoing request. */
const proxyTimeoutMs = Math.max(0, Number(process.env.PROXY_TIMEOUT_MS ?? 60000));

function isExpressResponse(res: unknown): res is Response {
  return typeof res === 'object' && res !== null && typeof (res as Response).status === 'function';
}

/**
 * Для HTTP `res` — Express Response. Для WebSocket upgrade при помилці апстріму передається Socket —
 * у нього немає `.status()`; інакше gateway падає з TypeError і весь процес завершується.
 */
function onProxyError(err: Error, _req: Request, res: Response | Socket) {
  console.error('[proxy]', err.message);
  if (isExpressResponse(res)) {
    if (!res.headersSent) {
      const isTimeout = /timeout/i.test(err.message);
      const status = isTimeout ? 504 : 502;
      res.status(status).json({
        success: false,
        error: {
          message: isTimeout ? 'Upstream service timed out' : 'Upstream service unavailable',
          ...(isProduction ? {} : { detail: err.message }),
        },
      });
    }
    return;
  }
  try {
    (res as Socket).destroy();
  } catch {
    /* ignore */
  }
}

/** Мікросервіси часто шлють свій CORS; браузер бачить їх у відповіді через gateway і блокує, якщо origin ≠ фронт (3001). */
function rewriteProxiedCorsHeaders(proxyRes: IncomingMessage) {
  const h = proxyRes.headers as Record<string, string | string[] | undefined>;
  const drop = (name: string) => {
    const key = Object.keys(h).find((k) => k.toLowerCase() === name);
    if (key) delete h[key];
  };
  ['access-control-allow-origin', 'access-control-allow-credentials', 'access-control-expose-headers'].forEach(drop);

  const origin = process.env.CORS_ORIGIN || 'http://localhost:3001';
  h['access-control-allow-origin'] = origin;
  h['access-control-allow-credentials'] = 'true';
}

export function createServiceProxy(target: string, extraOptions: Partial<Options> = {}) {
  const { onProxyRes: upstreamOnProxyRes, onProxyReq: upstreamOnProxyReq, ...rest } = extraOptions;
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onError: onProxyError,
    ...rest,
    onProxyReq(proxyReq: ClientRequest, req, res, options) {
      if (proxyTimeoutMs > 0) {
        proxyReq.setTimeout(proxyTimeoutMs, () => {
          proxyReq.destroy(new Error(`Upstream timeout after ${proxyTimeoutMs}ms`));
        });
      }
      if (typeof upstreamOnProxyReq === 'function') {
        upstreamOnProxyReq(proxyReq, req, res, options);
      }
    },
    onProxyRes(proxyRes, req, res) {
      rewriteProxiedCorsHeaders(proxyRes);
      if (typeof upstreamOnProxyRes === 'function') {
        upstreamOnProxyRes(proxyRes, req, res);
      }
    },
  });
}
