import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import { User, Admin } from '../models';
import { ApiResponse, AuthenticatedRequest, AppError, ErrorCodes } from '../types';
import { ResponseUtils } from '../utils/responseUtils';

const authMiddleware = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      ResponseUtils.unauthorizedResponse(res, 'Access token required');
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      ResponseUtils.unauthorizedResponse(res, 'Invalid or expired token');
      return;
    }

    // Handle user authentication
    if (decoded.userId) {
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        ResponseUtils.unauthorizedResponse(res, 'User not found or inactive');
        return;
      }

      req.user = {
        userId: decoded.userId
      };
    } 
    // Handle admin authentication
    else if (decoded.adminId) {
      const admin = await Admin.findByPk(decoded.adminId);

      if (!admin || !admin.isActive) {
        ResponseUtils.unauthorizedResponse(res, 'Admin not found or inactive');
        return;
      }

      req.user = {
        userId: decoded.adminId
      };
    } 
    // Invalid token payload
    else {
      ResponseUtils.unauthorizedResponse(res, 'Invalid token payload');
      return;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    ResponseUtils.serverErrorResponse(res, 'Authentication error');
  }
};

export default authMiddleware;
