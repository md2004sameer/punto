import { GrammarCheckResult } from '../../types/grammar.types';

export interface IGrammarLlmProvider {
  checkGrammar(text: string, options?: { language?: string }): Promise<GrammarCheckResult>;
}
