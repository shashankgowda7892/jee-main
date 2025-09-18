import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();

// Import route modules
import authRoutes from '../routes/authRoutes';
import adminRoutes from '../routes/adminRoutes';
import userRoutes from '../routes/userRoutes';
import whatAppRoutes from '../routes/whatAppRoutes';

// Use route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/whatsapp', whatAppRoutes);

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
