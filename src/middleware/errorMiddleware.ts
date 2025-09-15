import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '../types';
import { ResponseUtils } from '../utils/responseUtils';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (error instanceof AppError) {
    ResponseUtils.handleAppError(res, error);
  } else {
    ResponseUtils.error(
      res,
      'Internal server error',
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Async error wrapper to catch async errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  ResponseUtils.error(
    res,
    `Route ${req.originalUrl} not found`,
    ErrorCodes.NOT_FOUND
  );
};
