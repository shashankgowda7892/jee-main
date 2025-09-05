const { Admin } = require('../models');
const { generateToken } = require('../utils/jwtHelper');

// Admin login method
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin number and date of birth are required'
      });
    }

    // Find admin by admin number
    const admin = await Admin.findOne({
      where: { 
        emailId: email
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isPasswordValid = await admin.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const tokenPayload = {
      adminId: admin.adminId
    };

    const token = generateToken(tokenPayload);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        admin: {
          adminId: admin.adminId,
          email: admin.emailId,
        }
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

module.exports = {
    adminLogin
};
