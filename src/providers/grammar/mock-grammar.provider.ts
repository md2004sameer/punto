import { IGrammarLlmProvider } from './llm-provider.interface';
import { GrammarCheckResult } from '../../types/grammar.types';

export class MockGrammarProvider implements IGrammarLlmProvider {
  async checkGrammar(text: string, _options?: { language?: string }): Promise<GrammarCheckResult> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      correctedText: text,
      grammarScore: 100,
      errors: [],
    };
  }
}
