import { Request, Response } from 'express';
import { Exam } from '../models';
import { sequelize } from '../config/db';
import { 
  ApiResponse, 
  AuthenticatedRequest, 
  StartExamRequest, 
  SubmitAnswerRequest,
  FinishExamRequest,
  ErrorCodes 
} from '../types';
import { Op, QueryTypes } from 'sequelize';
import { EXAM_STATUS } from '../constants/ExamStatus';
import { ValidationUtils } from '../utils/validationUtils';
import { ResponseUtils } from '../utils/responseUtils';
import { ServiceFactory } from '../utils/serviceFactory';
import { StudentExamService } from '../services/studentExamService';

export const getUserExams = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Validate authentication
    if (!ValidationUtils.validateAuth(req.user)) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    const now = new Date();
    const exams = await Exam.findAll({
      where: {
        examDate: {
          [Op.lte]: now
        },
        isActive: true
      }
    });

    ResponseUtils.successResponse(res, 'Exams retrieved successfully', exams);
  } catch (error) {
    console.error('Get user exams error:', error);
    ResponseUtils.serverErrorResponse(res, 'Failed to retrieve exams');
  }
};

export const startExam = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Validate authentication
    if (!ValidationUtils.validateAuth(req.user)) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    // Validate request body
    const { examId }: StartExamRequest = req.body;
    ValidationUtils.validateRequiredFields(req.body, ['examId']);
    const validExamId = ValidationUtils.validatePositiveNumber(examId, 'examId');

    const userId = req.user.userId;

    // Get service instances
    const examService = ServiceFactory.getExamService();
    const questionService = ServiceFactory.getQuestionService();

    // Check if exam exists and is active
    const exam = await examService.getActiveExam(validExamId);
    if (!exam) {
      ResponseUtils.notFoundResponse(res, 'Exam not found or not active');
      return;
    }

    // Check if exam is available (has started)
    if (!examService.isExamAvailable(exam)) {
      ResponseUtils.badRequestResponse(res, 'Exam has not started yet');
      return;
    }

    // Get or create student exam record
    const existingStudentExam = await StudentExamService.getStudentExam(userId, validExamId);
    
    if (existingStudentExam && existingStudentExam.status === EXAM_STATUS.COMPLETED) {
      ResponseUtils.badRequestResponse(res, 'Exam already completed');
      return;
    }

    // Start student exam if not already started
    await StudentExamService.startStudentExam(userId, validExamId);

    // Get all questions with selected answers
    const questions = await questionService.getAllQuestionsWithAnswers(validExamId, userId);
    
    if (!questions || questions.length === 0) {
      ResponseUtils.notFoundResponse(res, 'No questions found for this exam');
      return;
    }

    ResponseUtils.successResponse(res, 'Exam started successfully', questions);

  } catch (error) {
    console.error('Start exam error:', error);
    ResponseUtils.handleUnknownError(res, error);
  }
};

export const submitAnswer = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Validate authentication
    if (!ValidationUtils.validateAuth(req.user)) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    // Validate request body
    const { examId, questionId, selectedAnswer }: SubmitAnswerRequest = req.body;
    ValidationUtils.validateRequiredFields(req.body, ['examId', 'questionId', 'selectedAnswer']);
    
    const validExamId = ValidationUtils.validatePositiveNumber(examId, 'examId');
    const validQuestionId = ValidationUtils.validatePositiveNumber(questionId, 'questionId');
    const validAnswer = ValidationUtils.validateAnswer(selectedAnswer);

    const userId = req.user.userId;

    // Use answer service to submit answer
    const answerService = ServiceFactory.getAnswerService();
    await answerService.submitAnswer(userId, validExamId, validQuestionId, validAnswer);

    ResponseUtils.successResponse(res, 'Answer submitted successfully');

  } catch (error) {
    console.error('Submit answer error:', error);
    ResponseUtils.handleUnknownError(res, error);
  }
};

export const finishExam = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Validate authentication
    if (!ValidationUtils.validateAuth(req.user)) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    // Validate request body
    const { examId }: FinishExamRequest = req.body;
    ValidationUtils.validateRequiredFields(req.body, ['examId']);
    const validExamId = ValidationUtils.validatePositiveNumber(examId, 'examId');

    const userId = req.user.userId;

    // Use exam service to validate exam
    const examService = ServiceFactory.getExamService();
    const exam = await examService.getActiveExam(validExamId);
    if (!exam) {
      ResponseUtils.notFoundResponse(res, 'Exam not found or not active');
      return;
    }

    // Calculate exam results using optimized query
    const resultQuery = `
      SELECT 
        COUNT(q.questionId) as totalQuestions,
        COUNT(CASE WHEN sa.selectedAnswer > 0 THEN 1 END) as questionsAnswered,
        (COUNT(q.questionId) - COUNT(CASE WHEN sa.selectedAnswer > 0 THEN 1 END)) as notAnswered,
        SUM(CASE WHEN sa.isCorrect = 1 AND sa.selectedAnswer > 0 THEN 1 ELSE 0 END) as correctAnswers,
        SUM(CASE WHEN sa.isCorrect = 0 AND sa.selectedAnswer > 0 THEN 1 ELSE 0 END) as wrongAnswers,
        (
          (SUM(CASE WHEN sa.isCorrect = 1 AND sa.selectedAnswer > 0 THEN 1 ELSE 0 END) * 4) - 
          (SUM(CASE WHEN sa.isCorrect = 0 AND sa.selectedAnswer > 0 THEN 1 ELSE 0 END) * 1)
        ) as totalMarks
      FROM questions q
      LEFT JOIN student_answers sa ON q.questionId = sa.questionId 
        AND sa.studentId = :userId 
        AND sa.examId = :examId
      WHERE q.examId = :examId AND q.isActive = 1
    `;

    const [results] = await sequelize.query(resultQuery, {
      replacements: { examId: validExamId, userId },
      type: QueryTypes.SELECT
    }) as any[];

    // Update student exam status to completed
    await StudentExamService.updateStudentExamStatus(userId, validExamId, EXAM_STATUS.COMPLETED);

    // Send successful response with results
    ResponseUtils.successResponse(res, 'Exam completed successfully', {
      questionsAnswered: parseInt(results.questionsAnswered) || 0,
      notAnswered: parseInt(results.notAnswered) || 0,
      correctAnswers: parseInt(results.correctAnswers) || 0,
      wrongAnswers: parseInt(results.wrongAnswers) || 0,
      totalMarks: parseInt(results.totalMarks) || 0
    });

  } catch (error) {
    console.error('Finish exam error:', error);
    ResponseUtils.handleUnknownError(res, error);
  }
};