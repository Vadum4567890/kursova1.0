import { Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

function onProxyError(err: Error, _req: Request, res: Response) {
  console.error('[proxy]', err.message);
  if (!res.headersSent) {
    res.status(502).json({
      success: false,
      error: {
        message: 'Upstream service unavailable',
        detail: err.message,
      },
    });
  }
}

export function createServiceProxy(target: string, extraOptions: Partial<Options> = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onError: onProxyError,
    ...extraOptions,
  });
}
