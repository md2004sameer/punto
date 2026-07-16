import { IGrammarLlmProvider } from '../providers/grammar/llm-provider.interface';
import { GrammarRequest, GrammarCheckResponse, GrammarError } from '../types/grammar.types';
import { LRUCache } from 'lru-cache';
import config from '../config';

export class GrammarService {
  private cache: LRUCache<string, GrammarCheckResponse>;

  constructor(private readonly llmProvider: IGrammarLlmProvider) {
    this.cache = new LRUCache<string, GrammarCheckResponse>({
      max: config.CACHE_MAX_ENTRIES,
      ttl: config.CACHE_TTL_MS,
    });
  }

  async checkGrammar(request: GrammarRequest): Promise<GrammarCheckResponse> {
    const { text, language, detailed } = request;
    const cacheKey = `${language}::${text}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.llmProvider.checkGrammar(text, { language });

    const errors: GrammarError[] = result.errors.map((e) => ({
      ...e,
      explanation: detailed ? e.explanation : undefined,
    }));

    const response: GrammarCheckResponse = {
      originalText: text,
      correctedText: result.correctedText,
      grammarScore: result.grammarScore,
      changesCount: result.errors.length,
      errors,
    };

    this.cache.set(cacheKey, response);
    return response;
  }
}
