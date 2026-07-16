import { AppError } from '../middleware/error-handler';

export class TextTooLongError extends AppError {
  constructor(maxLength: number) {
    super(`Text exceeds maximum allowed length of ${maxLength} characters.`, 400, 'TEXT_TOO_LONG');
  }
}
