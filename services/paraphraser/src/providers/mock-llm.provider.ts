import { ILlmProvider, ParaphraseResult } from './llm-provider.interface';
import { ParaphraseStyle } from '../types/paraphrase.types';

/**
 * A mock LLM provider that returns a predictable,
 * style‑specific paraphrase without any network call.
 *
 * Used for development and testing.
 */
export class MockLlmProvider implements ILlmProvider {
  async paraphrase(text: string, style: ParaphraseStyle): Promise<ParaphraseResult> {
    // Simulate network latency (200–500ms)
    const delay = Math.floor(Math.random() * 300) + 200;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      paraphrasedText: `[MOCK ${style}] ${text}`,
      confidence: 0.95,
    };
  }
}
