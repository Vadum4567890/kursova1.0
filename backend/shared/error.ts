/**
 * Unified error response format across all services
 *
 * Standard format:
 * {
 *   success: false,
 *   error: {
 *     code: string,           // e.g., "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"
 *     message: string,        // Human-readable message
 *     details?: unknown       // Optional: additional context
 *   }
 * }
 */

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

export function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.BAD_REQUEST:
      return 400;
    case ErrorCode.UNAUTHORIZED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.CONFLICT:
      return 409;
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;
    case ErrorCode.UPSTREAM_ERROR:
      return 502;
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toResponse(): ErrorResponse {
    return createErrorResponse(this.code, this.message, this.details);
  }

  getStatus(): number {
    return getHttpStatus(this.code);
  }
}
