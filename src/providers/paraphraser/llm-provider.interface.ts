import { ParaphraseStyle } from '../../types/paraphrase.types';

export interface ParaphraseResult {
  paraphrasedText: string;
  confidence: number;
}

export interface IParaphraserLlmProvider {
  paraphrase(text: string, style: ParaphraseStyle): Promise<ParaphraseResult>;
}
