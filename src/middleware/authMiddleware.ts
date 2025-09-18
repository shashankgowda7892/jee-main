import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import { User, Admin } from '../models';
import { ApiResponse, AuthenticatedRequest, AppError, ErrorCodes } from '../types';
import { ResponseUtils } from '../utils/responseUtils';

type UserRole = 'user' | 'admin'; // Easy to extend for future roles

/**
 * Generic authentication middleware with role-based access control
 * @param allowedRoles - Array of roles that are allowed to access the route. If empty, allows all authenticated users.
 * @returns Express middleware function
 * 
 * Usage examples:
 * - auth() - Any authenticated user
 * - auth(['user']) - Only users
 * - auth(['admin']) - Only admins  
 * - auth(['user', 'admin']) - Users and admins
 * - auth(['admin', 'teacher']) - Admins and teachers
 */
export const auth = (allowedRoles: UserRole[] = []) => {
  return async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
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

      // Handle authentication based on userType in the unified JWT structure
      if (decoded.userType === 'user') {
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
          ResponseUtils.unauthorizedResponse(res, 'User not found or inactive');
          return;
        }

        req.user = {
          userId: decoded.userId,
          userType: 'user',
          userData: user
        };
      } 
      else if (decoded.userType === 'admin') {
        const admin = await Admin.findByPk(decoded.userId);

        if (!admin || !admin.isActive) {
          ResponseUtils.unauthorizedResponse(res, 'Admin not found or inactive');
          return;
        }

        req.user = {
          userId: decoded.userId,
          userType: 'admin',
          userData: admin
        };
      }
      // Future: Add teacher role handling here
      // else if (decoded.userType === 'teacher') {
      //   const teacher = await Teacher.findByPk(decoded.userId);
      //   if (!teacher || !teacher.isActive) {
      //     ResponseUtils.unauthorizedResponse(res, 'Teacher not found or inactive');
      //     return;
      //   }
      //   req.user = {
      //     userId: decoded.userId,
      //     userType: 'teacher',
      //     userData: teacher
      //   };
      // }
      else {
        ResponseUtils.unauthorizedResponse(res, 'Invalid token payload');
        return;
      }

      // Role-based access control
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.userType as UserRole)) {
        const rolesList = allowedRoles.join(', ');
        ResponseUtils.unauthorizedResponse(res, `Access restricted to: ${rolesList}`);
        return;
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      ResponseUtils.serverErrorResponse(res, 'Authentication error');
    }
  };
};

// Alternative explicit naming
export const allowOnly = {
  users: () => auth(['user']),
  admins: () => auth(['admin']),
  usersAndAdmins: () => auth(['user', 'admin']),
  authenticatedUsers: () => auth([])
};

