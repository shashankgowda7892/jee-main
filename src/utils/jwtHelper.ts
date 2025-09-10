import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
};
