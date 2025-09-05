const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const adminAuthController = require('../controllers/adminAuthController');

// User authentication
router.post('/login', userAuthController.login);
router.post('/register', userAuthController.register);

module.exports = router;
