import { Response } from 'express';
import { ApiResponse, AppError, ErrorCodes } from '../types';

export class ResponseUtils {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = ErrorCodes.INTERNAL_SERVER_ERROR,
    error?: string
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      error
    };
    res.status(statusCode).json(response);
  }

  /**
   * Handle application errors
   */
  static handleAppError(res: Response, error: AppError): void {
    this.error(res, error.message, error.statusCode);
  }

  /**
   * Handle unknown errors
   */
  static handleUnknownError(res: Response, error: unknown): void {
    console.error('Unknown error:', error);
    
    if (error instanceof AppError) {
      this.handleAppError(res, error);
    } else {
      this.error(
        res,
        'Internal server error',
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Send unauthorized response
   */
  static unauthorizedResponse(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, message, ErrorCodes.UNAUTHORIZED);
  }

  /**
   * Send success response with data
   */
  static successResponse<T>(res: Response, message: string, data?: T): void {
    this.success(res, data, message, 200);
  }

  /**
   * Send server error response
   */
  static serverErrorResponse(res: Response, message: string = 'Internal server error'): void {
    this.error(res, message, ErrorCodes.INTERNAL_SERVER_ERROR);
  }

  /**
   * Send bad request response
   */
  static badRequestResponse(res: Response, message: string): void {
    this.error(res, message, ErrorCodes.BAD_REQUEST);
  }

  /**
   * Send not found response
   */
  static notFoundResponse(res: Response, message: string): void {
    this.error(res, message, ErrorCodes.NOT_FOUND);
  }
}
