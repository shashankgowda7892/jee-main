import { Request, Response } from 'express';
import { User } from '../models';
import { generateUserToken } from '../utils/jwtHelper';
import { ApiResponse } from '../types';

interface LoginRequest {
  studentNumber: string;
  dateOfBirth: string;
}

interface RegisterRequest {
  studentNumber: string;
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
}

// Login method
export const login = async (req: Request<{}, ApiResponse, LoginRequest>, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { studentNumber, dateOfBirth } = req.body;

    // Validate input
    if (!studentNumber || !dateOfBirth) {
      res.status(400).json({
        success: false,
        message: 'Student number and date of birth are required'
      });
      return;
    }

    // Find user by student number
    const user = await User.findOne({
      where: { 
        studentNumber: studentNumber,
        isActive: true 
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Verify date of birth (as password)
    const userDateOfBirth = new Date(user.dateOfBirth).toISOString().split("T")[0];
    if (userDateOfBirth !== dateOfBirth) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Update last login timestamp
    await user.update({ lastLogin: new Date() });

    // Generate JWT token for user
    const token = generateUserToken(user.userId);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: token,
        user: {
          userId: user.userId,
          studentNumber: user.studentNumber,
          name: user.name,
          phone: user.phoneNumber,
          dateOfBirth: user.dateOfBirth
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register method
export const register = async (req: Request<{}, ApiResponse, RegisterRequest>, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { studentNumber, name, phoneNumber, dateOfBirth } = req.body;

    // Validate input
    if (!studentNumber || !name || !phoneNumber  || !dateOfBirth) {
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { studentNumber }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this student number already exists'
      });
      return;
    }

    // Create new user (dateOfBirth is used as password verification)
    await User.create({
      studentNumber,
      name,
      phoneNumber,
      dateOfBirth: new Date(dateOfBirth)
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
