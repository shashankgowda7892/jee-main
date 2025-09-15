import { Request, Response } from 'express';
import { Admin } from '../models';
import { generateToken } from '../utils/jwtHelper';
import { ApiResponse } from '../types';

interface AdminLoginRequest {
  email: string;
  password: string;
}

// Admin login method
export const adminLogin = async (req: Request<{}, ApiResponse, AdminLoginRequest>, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Find admin by email
    const admin = await Admin.findOne({
      where: { 
        emailId: email,
        isActive: true
      }
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }
    
    const isPasswordValid = await admin.checkPassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    const tokenPayload = {
      adminId: admin.adminId
    };

    const token = generateToken(tokenPayload);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        accessToken : token,
        userId : admin.adminId
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
