import { IGrammarLlmProvider } from './llm-provider.interface';
import { GrammarCheckResult, grammarCheckResultSchema } from '../../types/grammar.types';
import config from '../../config';
import { logger } from '../../utils/logger';

const SYSTEM_PROMPT = `You are a professional English grammar checker.
Analyze the user's text for spelling, grammar, punctuation, capitalization, and sentence structure errors.
Return ONLY a valid JSON object with this exact format (no extra text, no markdown, no explanations):

{
  "correctedText": "<fully corrected version>",
  "grammarScore": <0-100 integer>,
  "errors": [
    {
      "type": "spelling|grammar|punctuation|capitalization|style",
      "startIndex": <integer>,
      "endIndex": <integer>,
      "originalFragment": "<erroneous substring>",
      "suggestion": "<corrected version>",
      "explanation": "<brief rule explanation>"
    }
  ]
}

Preserve the original meaning, tone, and style as much as possible.`;

export class DeepseekGrammarProvider implements IGrammarLlmProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.apiKey = config.DEEPSEEK_API_KEY;
    this.model = config.DEEPSEEK_MODEL;
    this.baseUrl = config.DEEPSEEK_BASE_URL;
    this.timeoutMs = config.DEEPSEEK_TIMEOUT_MS;
  }

  async checkGrammar(text: string, options?: { language?: string }): Promise<GrammarCheckResult> {
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
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${errorBody}`);
      }
      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error('DeepSeek returned an empty response.');

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const match = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          parsed = JSON.parse(match[1].trim());
        } else {
          throw new Error('Failed to parse grammar check result.');
        }
      }
      return grammarCheckResultSchema.parse(parsed);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('DeepSeek request timed out.');
      logger.error({ err: error }, 'DeepSeek grammar check failed');
      throw error;
    }
  }
}
