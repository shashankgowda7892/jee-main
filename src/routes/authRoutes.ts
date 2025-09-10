import express, { Router } from 'express';
import * as userAuthController from '../controllers/userAuthController';
import * as adminAuthController from '../controllers/adminAuthController';

const router: Router = express.Router();

// User authentication
router.post('/login', userAuthController.login);
router.post('/register', userAuthController.register);

// Admin authentication
router.post('/admin/login', adminAuthController.adminLogin);

export default router;
