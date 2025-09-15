import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import { User, Admin } from '../models';
import { ApiResponse, AuthenticatedRequest } from '../types';

const authMiddleware = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Handle new token format with 'id' field
    if (decoded.userId ) {
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
          res.status(401).json({
            success: false,
            message: 'User not found or inactive'
          });
          return;
        }

        req.user = {
          userId: decoded.userId
        };
      } else if (decoded.adminId) {
        const admin = await Admin.findByPk(decoded.adminId);

        if (!admin || !admin.isActive) {
          res.status(401).json({
            success: false,
            message: 'Admin not found or inactive'
          });
          
          req.user = {
            userId: decoded.adminId
          };
        }
      } else {
      res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export default authMiddleware;
