import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import config from './config';
import { logger } from './utils/logger';

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 AI Writer service running on http://localhost:${config.PORT}`);
  logger.info(`   Health check: http://localhost:${config.PORT}/health`);
  logger.info(`   Paraphrase:  POST http://localhost:${config.PORT}/api/v1/paraphrase`);
  logger.info(`   Grammar:     POST http://localhost:${config.PORT}/api/v1/grammar-check`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});
