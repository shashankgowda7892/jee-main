import express, { Router } from 'express';
import * as userController from '../controllers/UserControllers';
import { allowOnly } from '../middleware/authMiddleware';

const router: Router = express.Router();

router.get('/exams', allowOnly.users(), userController.getUserExams);
router.post('/exam/start', allowOnly.users(), userController.startExam);
router.post('/exam/answer', allowOnly.users(), userController.submitAnswer);
router.post('/exam/finish', allowOnly.users(), userController.finishExam);

export default router;
