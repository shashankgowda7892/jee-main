import { Request, Response } from 'express';
import { Exam, User, StudentExamResult } from '../models';
import { verifyToken } from '../utils/jwtHelper';
import { 
  ApiResponse, 
  AuthenticatedRequest, 
  StartExamRequest, 
  SubmitAnswerRequest,
  FinishExamRequest,
  StudentResultDto,
  ErrorCodes 
} from '../types';
import { Op, QueryTypes } from 'sequelize';
import { EXAM_STATUS } from '../constants/ExamStatus';
import { ResponseUtils } from '../utils/responseUtils';
import { ServiceFactory } from '../utils/serviceFactory';
import { StudentExamService } from '../services/studentExamService';
import { WhatsAppService } from '../services/whatsappService';

export const getUserExams = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Validate authentication
    if (!req.user || !req.user.userId) {
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
    if (!req.user || !req.user.userId) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    // Validate request body
    const { examId }: StartExamRequest = req.body;
    if (!examId) {
      ResponseUtils.badRequestResponse(res, 'Missing required field: examId');
      return;
    }

    if (typeof examId !== 'number' || examId <= 0) {
      ResponseUtils.badRequestResponse(res, 'examId must be a positive number');
      return;
    }

    const userId = req.user.userId;

    // Get service instances
    const examService = ServiceFactory.getExamService();
    const questionService = ServiceFactory.getQuestionService();

    // Check if exam exists and is active
    const exam = await examService.getActiveExam(examId);
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
    const existingStudentExam = await StudentExamService.getStudentExam(userId, examId);
    
    if (existingStudentExam && existingStudentExam.status === EXAM_STATUS.COMPLETED) {
      ResponseUtils.badRequestResponse(res, 'Exam already completed');
      return;
    }

    // Start student exam if not already started
    await StudentExamService.startStudentExam(userId, examId);

    // Get all questions with selected answers
    const questions = await questionService.getAllQuestionsWithAnswers(examId, userId);
    
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
    if (!req.user || !req.user.userId) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    // Validate request body
    const { examId, questionId, selectedAnswer }: SubmitAnswerRequest = req.body;
    if (!examId || !questionId || typeof selectedAnswer !== 'number') {
      ResponseUtils.badRequestResponse(res, 'Missing required fields: examId, questionId, selectedAnswer');
      return;
    }
    
    if (typeof examId !== 'number' || examId <= 0) {
      ResponseUtils.badRequestResponse(res, 'examId must be a positive number');
      return;
    }

    if (typeof questionId !== 'number' || questionId <= 0) {
      ResponseUtils.badRequestResponse(res, 'questionId must be a positive number');
      return;
    }

    if (selectedAnswer < 0 || selectedAnswer > 4) {
      ResponseUtils.badRequestResponse(res, 'selectedAnswer must be between 0 and 4');
      return;
    }

    const userId = req.user.userId;

    // Use answer service to submit answer
    const answerService = ServiceFactory.getAnswerService();
    await answerService.submitAnswer(userId, examId, questionId, selectedAnswer);

    ResponseUtils.successResponse(res, 'Answer submitted successfully');

  } catch (error) {
    console.error('Submit answer error:', error);
    ResponseUtils.handleUnknownError(res, error);
  }
};

export const finishExam = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Validate authentication
    if (!req.user || !req.user.userId) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    // Validate request body
    const { examId }: FinishExamRequest = req.body;
    if (!examId) {
      ResponseUtils.badRequestResponse(res, 'Missing required field: examId');
      return;
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      ResponseUtils.notFoundResponse(res, 'User not found');
      return;
    }

    // Use exam service to validate exam
    const examService = ServiceFactory.getExamService();
    const exam = await examService.getActiveExam(examId);
    if (!exam) {
      ResponseUtils.notFoundResponse(res, 'Exam not found or not active');
      return;
    }

    // Update student exam status to completed
    await StudentExamService.updateStudentExamStatus(user.userId, examId, EXAM_STATUS.COMPLETED);
    
    // Calculate exam results using optimized query
    const results = await examService.calculateExamResults(examId, user.userId);

    const studentResult: StudentResultDto = {
      totalQuestions: exam.totalQuestions,
      questionsAnswered: results.questionsAnswered,
      notAnswered: results.notAnswered,
      correctAnswers: results.correctAnswers,
      wrongAnswers: results.wrongAnswers,
      totalMarks: results.totalMarks
    };

    // Save Student Exam Result to database
    await StudentExamResult.upsert({
      studentId: user.userId,
      examId: examId,
      ...studentResult
    });

    //send whatsapp message
    await WhatsAppService.sendWhatsAppResult(user.phone,user.userId,user.name,exam.examId,studentResult);    // Send successful response with results

    // Response
    ResponseUtils.successResponse(res, 'Exam completed successfully', {
      questionsAnswered: results.questionsAnswered || 0,
      notAnswered: results.notAnswered || 0,
      correctAnswers: results.correctAnswers || 0,
      wrongAnswers: results.wrongAnswers || 0,
      totalMarks: results.totalMarks || 0
    });

  } catch (error) {
    console.error('Finish exam error:', error);
    ResponseUtils.handleUnknownError(res, error);
  }
};
