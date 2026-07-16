import { IParaphraserLlmProvider } from '../providers/paraphraser/llm-provider.interface';
import { ParaphraseRequest, ParaphraseResponse } from '../types/paraphrase.types';
import { LRUCache } from 'lru-cache';
import config from '../config';

export class ParaphraserService {
  private cache: LRUCache<string, ParaphraseResponse>;

  constructor(private readonly llmProvider: IParaphraserLlmProvider) {
    this.cache = new LRUCache<string, ParaphraseResponse>({
      max: config.CACHE_MAX_ENTRIES,
      ttl: config.CACHE_TTL_MS,
    });
  }

  async paraphrase(request: ParaphraseRequest): Promise<ParaphraseResponse> {
    const { text, style } = request;
    const cacheKey = `${style}::${text}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.llmProvider.paraphrase(text, style);
    const response: ParaphraseResponse = {
      original: text,
      paraphrased: result.paraphrasedText,
      style,
      confidence: result.confidence,
    };

    this.cache.set(cacheKey, response);
    return response;
  }
}
