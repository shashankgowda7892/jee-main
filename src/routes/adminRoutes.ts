import express, { Router } from 'express';
import multer from 'multer';
import * as adminController from '../controllers/adminController';
import { allowOnly } from '../middleware/authMiddleware';

const router: Router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/users', allowOnly.admins(), adminController.getUsers);
router.post('/questions/upload', allowOnly.admins(), upload.single('file'), adminController.uploadQuestions);
router.get('/exams', allowOnly.admins(), adminController.getExams);
router.post('/update/exam', allowOnly.admins(), adminController.updateExam);

export default router;
