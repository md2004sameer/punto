import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiErrorResponse } from '../types/paraphrase.types';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId || 'unknown';
  logger.error({ requestId, err }, 'Unhandled error');
  const response: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
  res.status(500).json(response);
}
