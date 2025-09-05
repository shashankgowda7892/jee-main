const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Public admin routes
router.post('/login', adminAuthController.adminLogin);
router.get('/users',authMiddleware, adminController.getUsers);


module.exports = router;
