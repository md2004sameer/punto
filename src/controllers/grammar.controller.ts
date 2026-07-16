import { Request, Response } from 'express';
import { GrammarService } from '../services/grammar.service';
import {
  grammarRequestSchema,
  ApiErrorResponse,
} from '../types/grammar.types';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class GrammarController {
  constructor(private readonly service: GrammarService) {}

  async handle(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId || 'unknown';

    try {
      const parsed = grammarRequestSchema.safeParse(req.body);

      if (!parsed.success) {
        logger.warn({ requestId, issues: parsed.error.issues }, 'Validation error');
        const errorResponse: ApiErrorResponse = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: this.formatZodErrors(parsed.error),
          },
          requestId,
          timestamp: new Date().toISOString(),
        };
        res.status(422).json(errorResponse);
        return;
      }

      const result = await this.service.checkGrammar(parsed.data);
      res.status(200).json(result);
    } catch (error) {
      logger.error({ requestId, err: error }, 'Unexpected error');
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        requestId,
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(errorResponse);
    }
  }

  private formatZodErrors(error: ZodError): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'body';
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return fieldErrors;
  }
}
