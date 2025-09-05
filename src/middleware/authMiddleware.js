const { verifyToken } = require('../utils/jwtHelper');
const { User, Admin } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    if (decoded.userId) {
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      req.user = {
        userId: user.userId
      };
    } else if (decoded.adminId) {
      const admin = await Admin.findByPk(decoded.adminId);

      if (!admin || !admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found or inactive'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = authMiddleware;