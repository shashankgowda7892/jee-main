const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminAuthController');
const adminManagementController = require('../controllers/adminManagementController');
const authMiddleware = require('../middleware/authMiddleware');

// Public admin routes
router.post('/login', adminController.adminLogin);


module.exports = router;
