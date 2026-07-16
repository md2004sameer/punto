import { IParaphraserLlmProvider, ParaphraseResult } from './llm-provider.interface';
import { ParaphraseStyle } from '../../types/paraphrase.types';

export class MockLlmProvider implements IParaphraserLlmProvider {
  async paraphrase(text: string, style: ParaphraseStyle): Promise<ParaphraseResult> {
    const stylePrefix: Record<ParaphraseStyle, string> = {
      standard: '[Standard] ',
      formal: '[Formal] ',
      academic: '[Academic] ',
      simple: '[Simple] ',
      creative: '[Creative] ',
      fluent: '[Fluent] ',
    };

    return {
      paraphrasedText: `${stylePrefix[style] || ''}${text}`,
      confidence: 0.90,
    };
  }
}
