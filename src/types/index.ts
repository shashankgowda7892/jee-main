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
    userId?: number,
    adminId?: number
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
