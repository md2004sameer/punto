/**
 * Splits text into chunks that are under the max length.
 * Tries to split on sentence boundaries (. ! ?) to keep context.
 */
export function chunkText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  // Try to split by sentences first (ends with . ! ?)
  const sentenceRegex = /(?<=[.!?])\s+/g;
  const sentences = text.split(sentenceRegex);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    // If a single sentence is longer than max, we force split it by characters
    if (sentence.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // Split the long sentence by characters
      for (let i = 0; i < sentence.length; i += maxLength) {
        chunks.push(sentence.slice(i, i + maxLength).trim());
      }
      continue;
    }

    // Check if adding this sentence exceeds max length
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
