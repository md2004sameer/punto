import { Request, Response, NextFunction } from 'express';
import { ParaphraserService } from '../services/paraphraser.service';
import { paraphraseRequestSchema } from '../types/paraphrase.types';
import { ValidationError } from '../errors';
import { logger } from '../utils/logger';

export class ParaphraseController {
  constructor(private readonly service: ParaphraserService) {}

  handle = async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId || 'unknown';

    const parsed = paraphraseRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = this.formatZodErrors(parsed.error);
      logger.warn({ requestId, issues: details }, 'Validation error');
      return next(new ValidationError('Invalid request body', details));
    }

    const result = await this.service.paraphrase(parsed.data);
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
