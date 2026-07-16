import { z } from 'zod';

export const grammarRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text must be under 5000 characters').transform((s) => s.trim()),
  language: z.string().optional().default('en'),
  detailed: z.boolean().optional().default(false),
});

export type GrammarRequest = z.infer<typeof grammarRequestSchema>;

export const grammarErrorSchema = z.object({
  type: z.enum(['spelling', 'grammar', 'punctuation', 'capitalization', 'style']),
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  originalFragment: z.string(),
  suggestion: z.string(),
  explanation: z.string().optional(),
});

export type GrammarError = z.infer<typeof grammarErrorSchema>;

export const grammarCheckResultSchema = z.object({
  correctedText: z.string(),
  grammarScore: z.number().int().min(0).max(100),
  errors: z.array(grammarErrorSchema),
});

export type GrammarCheckResult = z.infer<typeof grammarCheckResultSchema>;

export interface GrammarCheckResponse {
  originalText: string;
  correctedText: string;
  grammarScore: number;
  changesCount: number;
  errors: GrammarError[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
  requestId?: string;
  timestamp?: string;
}
