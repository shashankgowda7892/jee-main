import { Request } from 'express';
import { AppError, ErrorCodes, JWTPayload } from '../types';

export class ValidationUtils {
  /**
   * Validate required fields in request body
   */
  static validateRequiredFields(
    body: any, 
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(field => 
      !body[field] && body[field] !== 0
    );

    if (missingFields.length > 0) {
      throw new AppError(
        `Missing required fields: ${missingFields.join(', ')}`,
        ErrorCodes.BAD_REQUEST
      );
    }
  }

  /**
   * Validate user authentication
   */
  static validateAuthentication(req: Request): number {
    const user = (req as any).user;
    if (!user || !user.userId) {
      throw new AppError('User not authenticated', ErrorCodes.UNAUTHORIZED);
    }
    return user.userId;
  }

  /**
   * Validate number field
   */
  static validateNumber(value: any, fieldName: string): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new AppError(
        `${fieldName} must be a valid number`,
        ErrorCodes.BAD_REQUEST
      );
    }
    return value;
  }

  /**
   * Validate positive number
   */
  static validatePositiveNumber(value: any, fieldName: string): number {
    const num = this.validateNumber(value, fieldName);
    if (num <= 0) {
      throw new AppError(
        `${fieldName} must be a positive number`,
        ErrorCodes.BAD_REQUEST
      );
    }
    return num;
  }

  /**
   * Validate selected answer (1-4 or 0 for not answered)
   */
  static validateSelectedAnswer(selectedAnswer: any): number {
    const answer = this.validateNumber(selectedAnswer, 'selectedAnswer');
    if (answer < 0 || answer > 4) {
      throw new AppError(
        'Selected answer must be between 0 and 4',
        ErrorCodes.BAD_REQUEST
      );
    }
    return answer;
  }

  /**
   * Validate authentication from user object
   */
  static validateAuth(user?: JWTPayload): user is JWTPayload {
    return !!(user && user.userId);
  }

  /**
   * Validate answer (0-4)
   */
  static validateAnswer(answer: any): number {
    if (!Number.isInteger(answer) || answer < 0 || answer > 4) {
      throw new AppError('Invalid answer: must be between 0 and 4', ErrorCodes.BAD_REQUEST);
    }
    return answer;
  }
}
