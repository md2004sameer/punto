import { ParaphraseStyle } from '../types/paraphrase.types';

/**
 * Every LLM provider must return this shape.
 * The service layer only cares about the result string and confidence.
 */
export interface ParaphraseResult {
  paraphrasedText: string;
  confidence: number;
}

/**
 * The LLM provider contract.
 * Any provider (mock, DeepSeek, OpenAI) implements this.
 */
export interface ILlmProvider {
  paraphrase(text: string, style: ParaphraseStyle): Promise<ParaphraseResult>;
}
