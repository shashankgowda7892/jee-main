import express, { Router } from 'express';
import * as userController from '../controllers/UserControllers';
import { allowOnly } from '../middleware/authMiddleware';

const router: Router = express.Router();

router.get('/exams', allowOnly.users(), userController.getUserExams);
// send only first question
router.post('/exam/start', allowOnly.users(), userController.startExam);
// create a router for questions
router.get('/exam/question', allowOnly.users(), userController.getQuestion);
// answering the question
router.post('/exam/answer', allowOnly.users(), userController.submitAnswer);
router.post('/exam/finish', allowOnly.users(), userController.finishExam);

export default router;
