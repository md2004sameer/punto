import express from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/request-id';
import { defaultLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error-handler';
import { asyncHandler } from './utils/async-handler';
import config from './config';
import { logger } from './utils/logger';

// Paraphraser
import { ParaphraserService } from './services/paraphraser.service';
import { ParaphraseController } from './controllers/paraphrase.controller';
import { DeepseekParaphraserProvider } from './providers/paraphraser/deepseek.provider';
import { MockLlmProvider } from './providers/paraphraser/mock-llm.provider';
import { ResilientParaphraserProvider } from './providers/paraphraser/resilient-llm.provider';

// Grammar
import { GrammarService } from './services/grammar.service';
import { GrammarController } from './controllers/grammar.controller';
import { DeepseekGrammarProvider } from './providers/grammar/deepseek.provider';
import { MockGrammarProvider } from './providers/grammar/mock-grammar.provider';
import { ResilientGrammarProvider } from './providers/grammar/resilient-llm.provider';

// --- Build Paraphraser ---
const paraphraserDeepseek = new DeepseekParaphraserProvider();
const paraphraserMock = new MockLlmProvider();
const paraphraserProvider = new ResilientParaphraserProvider(paraphraserDeepseek, {
  timeout: config.CIRCUIT_BREAKER_TIMEOUT_MS,
  errorThresholdPercentage: config.CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENT,
  resetTimeout: config.CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
  fallbackProvider: paraphraserMock,
});
const paraphraserService = new ParaphraserService(paraphraserProvider);
const paraphraserController = new ParaphraseController(paraphraserService);

// --- Build Grammar Checker ---
const grammarDeepseek = new DeepseekGrammarProvider();
const grammarMock = new MockGrammarProvider();
const grammarProvider = new ResilientGrammarProvider(grammarDeepseek, {
  timeout: config.CIRCUIT_BREAKER_TIMEOUT_MS,
  errorThresholdPercentage: config.CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENT,
  resetTimeout: config.CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
  fallbackProvider: grammarMock,
});
const grammarService = new GrammarService(grammarProvider);
const grammarController = new GrammarController(grammarService);

// --- Express App ---
const app = express();

app.use(cors());
app.use(express.json({ limit: config.BODY_SIZE_LIMIT }));
app.use(requestIdMiddleware);

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, requestId: (req as any).requestId }, 'Incoming request');
  next();
});

// Rate limit the AI endpoints
app.use('/api/v1/paraphrase', defaultLimiter);
app.use('/api/v1/grammar-check', defaultLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes (with async error wrapping)
app.post('/api/v1/paraphrase', asyncHandler(paraphraserController.handle));
app.post('/api/v1/grammar-check', asyncHandler(grammarController.handle));

app.use(errorHandler);

export default app;
