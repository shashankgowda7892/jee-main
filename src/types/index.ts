import { Request } from 'express';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: string;
  logging: boolean;
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface JWTPayload {
    userId?: number;
    adminId?: number;
    examId?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
      userId: number;
  };
}

// DTOs for better data validation
export interface StartExamRequest {
  examId: number;
}

export interface SubmitAnswerRequest {
  examId: number;
  questionId: number;
  selectedAnswer: number;
}

export interface FinishExamRequest {
  examId: number;
}

// Response DTOs
export interface QuestionDto {
  questionId: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  subject: string;
  examId: number;
  selectedAnswer: number;
}

export interface ExamResultDto {
  questionsAnswered: number;
  notAnswered: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalMarks: number;
}

export interface ExamDto {
  examId: number;
  duration: number;
  totalQuestions: number;
  examDate: Date;
  isActive: boolean;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export enum ErrorCodes {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500
}
