export class ValidationError extends Error {
  constructor(message = 'Validation failed', public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ProviderTimeoutError extends Error {
  constructor(message = 'AI provider timed out') {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderUnavailableError extends Error {
  constructor(message = 'AI provider unavailable') {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'AI provider rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class PromptTooLongError extends Error {
  constructor(message = 'Prompt is too long') {
    super(message);
    this.name = 'PromptTooLongError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'AI provider authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class InternalAIError extends Error {
  constructor(message = 'Internal AI service error') {
    super(message);
    this.name = 'InternalAIError';
  }
}
