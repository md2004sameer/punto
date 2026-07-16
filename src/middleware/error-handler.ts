import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {
  ValidationError,
  AuthenticationError,
  RateLimitError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  InternalAIError,
} from '../errors';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId || 'unknown';

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (err instanceof ValidationError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = err.message;
    details = err.details;
  } else if (err instanceof AuthenticationError) {
    statusCode = 500; // Internal because it's our auth to the provider, not user's fault
    code = 'AI_AUTHENTICATION_ERROR';
    message = 'AI provider authentication failed. Check API key.';
  } else if (err instanceof RateLimitError) {
    statusCode = 503;
    code = 'AI_RATE_LIMITED';
    message = 'AI provider rate limit exceeded. Please try again later.';
  } else if (err instanceof ProviderTimeoutError) {
    statusCode = 504;
    code = 'AI_TIMEOUT';
    message = 'AI provider timed out. Please try again.';
  } else if (err instanceof ProviderUnavailableError) {
    statusCode = 503;
    code = 'AI_UNAVAILABLE';
    message = 'AI provider is temporarily unavailable.';
  } else if (err instanceof InternalAIError) {
    statusCode = 502;
    code = 'AI_INTERNAL_ERROR';
    message = err.message;
  }

  logger.error({ requestId, err, statusCode }, `Error handled: ${code}`);

  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
    },
    requestId,
    timestamp: new Date().toISOString(),
  });
}
