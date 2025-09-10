import express, { Router } from 'express';
import multer from 'multer';
import * as adminController from '../controllers/adminController';
import authMiddleware from '../middleware/authMiddleware';

const router: Router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Protected admin routes
router.get('/users', authMiddleware, adminController.getUsers);
router.post('/questions/upload', authMiddleware, upload.single('file'), adminController.uploadQuestions);
router.get('/exams', authMiddleware, adminController.getExams);
router.post('/update/exam', authMiddleware, adminController.updateExam);

export default router;
