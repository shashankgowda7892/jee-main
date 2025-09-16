import express, { Router } from 'express';
import * as userController from '../controllers/UserControllers';
import authMiddleware from '../middleware/authMiddleware';

const router: Router = express.Router();

// Import controller
router.get('/exams', authMiddleware, userController.getUserExams);
router.post('/exam/start', authMiddleware, userController.startExam);
router.post('/exam/answer', authMiddleware, userController.submitAnswer);
router.post('/exam/finish', authMiddleware, userController.finishExam);
router.get('/exam/result', userController.downloadResultPdf);


export default router;
