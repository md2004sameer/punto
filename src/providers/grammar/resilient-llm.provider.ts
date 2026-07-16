import CircuitBreaker from 'opossum';
import { IGrammarLlmProvider } from './llm-provider.interface';
import { GrammarCheckResult } from '../../types/grammar.types';
import { MockGrammarProvider } from './mock-grammar.provider';
import { logger } from '../../utils/logger';

export class ResilientGrammarProvider implements IGrammarLlmProvider {
  private breaker: CircuitBreaker;
  private fallbackProvider: IGrammarLlmProvider;

  constructor(
    primaryProvider: IGrammarLlmProvider,
    options?: {
      timeout?: number;
      errorThresholdPercentage?: number;
      resetTimeout?: number;
      fallbackProvider?: IGrammarLlmProvider;
    }
  ) {
    this.fallbackProvider = options?.fallbackProvider || new MockGrammarProvider();
    this.breaker = new CircuitBreaker(
      (text: string, opts?: { language?: string }) => primaryProvider.checkGrammar(text, opts),
      {
        timeout: options?.timeout || 12000,
        errorThresholdPercentage: options?.errorThresholdPercentage || 50,
        resetTimeout: options?.resetTimeout || 30000,
        name: 'deepseek-grammar',
      }
    );

    this.breaker.on('open', () => logger.warn('[CircuitBreaker:grammar] OPEN'));
    this.breaker.on('halfOpen', () => logger.info('[CircuitBreaker:grammar] HALF-OPEN'));
    this.breaker.on('close', () => logger.info('[CircuitBreaker:grammar] CLOSED'));

    this.breaker.fallback((text: string, opts?: { language?: string }) => {
      logger.warn('[CircuitBreaker:grammar] Fallback activated');
      return this.fallbackProvider.checkGrammar(text, opts);
    });
  }

  async checkGrammar(text: string, options?: { language?: string }): Promise<GrammarCheckResult> {
    return this.breaker.fire(text, options);
  }
}
