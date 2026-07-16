import { env } from '../config';
import { logger } from '../utils/logger';
import { ParaphraseStyle } from '../types/paraphrase.types';
import { IParaphraserLlmProvider } from '../providers/paraphraser/llm-provider.interface';
import { chunkText } from '../utils/text-chunker';

export class ParaphraserService {
  constructor(private provider: IParaphraserLlmProvider) {}

  async paraphrase(text: string, style: ParaphraseStyle) {
    const maxLength = env.MAX_TEXT_LENGTH;

    // If under limit, process directly
    if (text.length <= maxLength) {
      logger.debug({ textLength: text.length, style }, 'Paraphrasing single chunk');
      const result = await this.provider.paraphrase(text, style);
      return {
        originalText: text,
        paraphrasedText: result.paraphrasedText,
        confidence: result.confidence,
        chunksProcessed: 1,
      };
    }

    // LONG TEXT: Split into chunks and process in parallel
    logger.info({ textLength: text.length, chunks: 'calculating' }, 'Long text detected, chunking...');
    const chunks = chunkText(text, maxLength);
    logger.info({ chunkCount: chunks.length }, 'Processing chunks in parallel');

    // Process all chunks concurrently
    const results = await Promise.all(
      chunks.map((chunk) => this.provider.paraphrase(chunk, style))
    );

    // Stitch results back together
    const paraphrasedText = results.map((r) => r.paraphrasedText).join(' ');
    const avgConfidence = results.reduce((acc, r) => acc + r.confidence, 0) / results.length;

    return {
      originalText: text,
      paraphrasedText,
      confidence: Math.round(avgConfidence * 100) / 100,
      chunksProcessed: results.length,
    };
  }
}
