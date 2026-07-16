import { IParaphraserLlmProvider, ParaphraseResult } from './llm-provider.interface';
import { ParaphraseStyle } from '../../types/paraphrase.types';
import config from '../../config';
import {
  AuthenticationError,
  RateLimitError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  InternalAIError,
} from '../../errors';

const STYLE_INSTRUCTIONS: Record<ParaphraseStyle, string> = {
  standard: 'Rewrite the sentence in a straightforward way, preserving the original meaning.',
  formal: 'Rewrite the sentence in a highly formal, professional tone. Use sophisticated vocabulary.',
  academic: 'Rewrite the sentence in an academic style suitable for research papers. Use precise terminology.',
  simple: 'Rewrite the sentence using simple words and short sentences. Make it easy to understand for a 10-year-old.',
  creative: 'Rewrite the sentence in a vivid, engaging way. Use metaphors or imagery if appropriate.',
  fluent: 'Rewrite the sentence so it sounds natural and fluent, as if written by a native English speaker.',
};

const SYSTEM_PREFIX = `You are a paraphrasing assistant. 
Rewrite the user's text according to the given style.
Return ONLY the paraphrased text, no extra words, no quotation marks, no explanations.`;

export class DeepseekParaphraserProvider implements IParaphraserLlmProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.apiKey = config.DEEPSEEK_API_KEY;
    this.model = config.DEEPSEEK_MODEL;
    this.baseUrl = config.DEEPSEEK_BASE_URL;
    this.timeoutMs = config.DEEPSEEK_TIMEOUT_MS;
    if (!this.apiKey) {
      console.warn('[DeepseekParaphraserProvider] No API key provided – provider will fail at runtime.');
    }
  }

  async paraphrase(text: string, style: ParaphraseStyle): Promise<ParaphraseResult> {
    const styleInstruction = STYLE_INSTRUCTIONS[style];
    const systemPrompt = `${SYSTEM_PREFIX} ${styleInstruction}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError();
        }
        if (response.status === 429) {
          throw new RateLimitError();
        }
        const errorBody = await response.text();
        throw new ProviderUnavailableError(`DeepSeek API error ${response.status}: ${errorBody}`);
      }
      const data = (await response.json()) as any;
      const paraphrasedText = data?.choices?.[0]?.message?.content?.trim();
      if (!paraphrasedText) throw new InternalAIError('DeepSeek returned an empty response.');
      return { paraphrasedText, confidence: 0.85 };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ProviderTimeoutError();
      }
      if (error instanceof AuthenticationError || error instanceof RateLimitError || error instanceof ProviderUnavailableError || error instanceof InternalAIError || error instanceof ProviderTimeoutError) {
        throw error;
      }
      // Wrap unknown errors
      throw new InternalAIError(error.message || 'Unknown DeepSeek error');
    }
  }
}
