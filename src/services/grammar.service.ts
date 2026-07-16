import { env } from '../config';
import { logger } from '../utils/logger';
import { IGrammarProvider } from '../providers/grammar/grammar-provider.interface';
import { chunkText } from '../utils/text-chunker';

export class GrammarService {
  constructor(private provider: IGrammarProvider) {}

  async checkGrammar(text: string, language: string, detailed: boolean) {
    const maxLength = env.MAX_TEXT_LENGTH;

    // If under limit, process directly
    if (text.length <= maxLength) {
      logger.debug({ textLength: text.length, language }, 'Checking grammar for single chunk');
      const result = await this.provider.checkGrammar(text, language, detailed);
      return {
        originalText: text,
        correctedText: result.correctedText,
        issues: result.issues,
        chunksProcessed: 1,
      };
    }

    // LONG TEXT: Chunk and process in parallel
    logger.info({ textLength: text.length, chunks: 'calculating' }, 'Long text detected for grammar check, chunking...');
    const chunks = chunkText(text, maxLength);
    logger.info({ chunkCount: chunks.length }, 'Processing grammar chunks in parallel');

    // Process all chunks concurrently
    const results = await Promise.all(
      chunks.map((chunk) => this.provider.checkGrammar(chunk, language, detailed))
    );

    // Stitch corrections and collect all issues
    const correctedText = results.map((r) => r.correctedText).join(' ');
    const allIssues = results.flatMap((r) => r.issues || []);

    return {
      originalText: text,
      correctedText,
      issues: allIssues,
      chunksProcessed: results.length,
    };
  }
}
