const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminAuthController = require('../controllers/adminAuthController');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public admin routes
router.post('/login', adminAuthController.adminLogin);
router.get('/users',authMiddleware, adminController.getUsers);
router.post('/questions/upload',authMiddleware,upload.single('file'), adminController.uploadQuestions);
router.get('/exams',authMiddleware, adminController.getExams);
router.post('/update/exam',authMiddleware, adminController.updateExam);

module.exports = router;
