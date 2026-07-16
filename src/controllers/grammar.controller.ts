import { Request, Response, NextFunction } from 'express';
import { GrammarService } from '../services/grammar.service';
import { grammarRequestSchema } from '../types/grammar.types';
import { ValidationError } from '../errors';
import { logger } from '../utils/logger';

export class GrammarController {
  constructor(private readonly service: GrammarService) {}

  handle = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId || 'unknown';

    const parsed = grammarRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = this.formatZodErrors(parsed.error);
      logger.warn({ requestId, issues: details }, 'Validation error');
      return next(new ValidationError('Invalid request body', details));
    }

    const result = await this.service.checkGrammar(parsed.data);
    res.status(200).json(result);
  };

  private formatZodErrors(error: any): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'body';
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return fieldErrors;
  }
}
