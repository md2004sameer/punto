import CircuitBreaker from 'opossum';
import { IParaphraserLlmProvider, ParaphraseResult } from './llm-provider.interface';
import { ParaphraseStyle } from '../../types/paraphrase.types';
import { MockLlmProvider } from './mock-llm.provider';
import { logger } from '../../utils/logger';

export class ResilientParaphraserProvider implements IParaphraserLlmProvider {
  private breaker: CircuitBreaker;
  private fallbackProvider: IParaphraserLlmProvider;

  constructor(
    primaryProvider: IParaphraserLlmProvider,
    options?: {
      timeout?: number;
      errorThresholdPercentage?: number;
      resetTimeout?: number;
      fallbackProvider?: IParaphraserLlmProvider;
    }
  ) {
    this.fallbackProvider = options?.fallbackProvider || new MockLlmProvider();
    this.breaker = new CircuitBreaker(
      (text: string, style: ParaphraseStyle) => primaryProvider.paraphrase(text, style),
      {
        timeout: options?.timeout || 12000,
        errorThresholdPercentage: options?.errorThresholdPercentage || 50,
        resetTimeout: options?.resetTimeout || 30000,
        name: 'deepseek-paraphraser',
      }
    );

    this.breaker.on('open', () => logger.warn('[CircuitBreaker:paraphraser] OPEN'));
    this.breaker.on('halfOpen', () => logger.info('[CircuitBreaker:paraphraser] HALF-OPEN'));
    this.breaker.on('close', () => logger.info('[CircuitBreaker:paraphraser] CLOSED'));

    this.breaker.fallback((text: string, style: ParaphraseStyle) => {
      logger.warn('[CircuitBreaker:paraphraser] Fallback activated');
      return this.fallbackProvider.paraphrase(text, style);
    });
  }

  async paraphrase(text: string, style: ParaphraseStyle): Promise<ParaphraseResult> {
    return this.breaker.fire(text, style);
  }
}
