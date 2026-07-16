import { z } from 'zod';

export const PARAPHRASE_STYLES = [
  'standard',
  'formal',
  'academic',
  'simple',
  'creative',
  'fluent',
] as const;

export type ParaphraseStyle = (typeof PARAPHRASE_STYLES)[number];

export const paraphraseRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text must be under 5000 characters').transform((s) => s.trim()),
  style: z.enum(PARAPHRASE_STYLES, {
    errorMap: () => ({ message: `Style must be one of: ${PARAPHRASE_STYLES.join(', ')}` }),
  }),
});

export type ParaphraseRequest = z.infer<typeof paraphraseRequestSchema>;

export interface ParaphraseResponse {
  original: string;
  paraphrased: string;
  style: ParaphraseStyle;
  confidence: number;
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
