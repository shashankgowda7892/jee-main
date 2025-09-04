const { User } = require('../models');
const { generateToken } = require('../utils/jwtHelper');

// Login method
const login = async (req, res) => {
  try {
    const { studentNumber, dateOfBirth } = req.body;

    // Validate input
    if (!studentNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Student number and date of birth are required'
      });
    }

    // Find user by student number
    const user = await User.findOne({
      where: { 
        studentNumber: studentNumber,
        isActive: true 
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify date of birth (as password)
    if (userDateOfBirth !== dateOfBirth) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login timestamp
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const tokenPayload = {
      userId: user.userId
    };

    const token = generateToken(tokenPayload);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: user.userId,
          studentNumber: user.studentNumber,
          name: user.name,
          phone: user.phone,
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

// Register method (if needed)
const register = async (req, res) => {
  try {
    const { studentNumber, name, phone, dateOfBirth } = req.body;

    // Validate input
    if (!studentNumber || !name || !phone || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { studentNumber }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this student number already exists'
      });
    }

    // Create new user (dateOfBirth is used as password verification)
    const newUser = await User.create({
      studentNumber,
      name,
      phone,
      dateOfBirth
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  register
};
