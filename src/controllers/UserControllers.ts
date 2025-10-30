import { Request, Response } from 'express';
import { Exam, User, StudentExamResult, StudentExam } from '../models';
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
    // Get userId from request user
    const userId = req.user?.userId;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      ResponseUtils.notFoundResponse(res, 'User not found');
      return;
    }

    // Get current date for comparison (date only, no time)
    const currentDate = new Date();
    const today = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Single SQL query to get exams with completion status
    const query = `
      SELECT 
        e.examId,
        e.examCode,
        e.examDate,
        e.duration,
        e.totalQuestions,
        CASE 
          WHEN DATE(e.examDate) < :currentDate THEN true
          WHEN se.status = 2 THEN true
          ELSE false
        END as is_completed,
        COALESCE(se.startedAt, 0) as startedAt
      FROM exams e
      LEFT JOIN student_exams se ON e.examId = se.examId AND se.userId = :userId
      WHERE DATE(e.examDate) <= :currentDate 
        AND e.isActive = 1
      ORDER BY e.examId DESC
      LIMIT 5
    `;

    const results = await Exam.sequelize?.query(query, {
      replacements: { 
        userId: userId,
        currentDate: today 
      },
      type: QueryTypes.SELECT
    }) as any[];

    ResponseUtils.successResponse(res, 'Exams retrieved successfully', results);
  } catch (error) {
    console.error('Get user exams error:', error);
    ResponseUtils.serverErrorResponse(res, 'Failed to retrieve exams');
  }
};

export const startExam = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {

    // Validate request body
    const { examId }: StartExamRequest = req.body;
    if (!examId) {
      ResponseUtils.badRequestResponse(res, 'Missing required field: examId');
      return;
    }

    const userId = req.user?.userId;
    if (typeof userId !== 'number') {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

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

    // Get only the first question for exam start
    const firstQuestion = await questionService.getFirstQuestion(examId, userId);
    
    if (!firstQuestion) {
      ResponseUtils.notFoundResponse(res, 'No questions found for this exam');
      return;
    }

    ResponseUtils.successResponse(res, 'Exam started successfully', {
      exam: {
        examId: exam.examId,
        examCode: exam.examCode,
        totalQuestions: exam.totalQuestions,
        duration: exam.duration
      },
      firstQuestion: firstQuestion
    });

  } catch (error) {
    console.error('Start exam error:', error);
    ResponseUtils.handleUnknownError(res, error);
  }
};

export const getQuestion = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    // Validate authentication
    if (!req.user || !req.user.userId) {
      ResponseUtils.unauthorizedResponse(res, 'User not authenticated');
      return;
    }

    // Get query parameters
    const { examId, subject, question } = req.query;

    // Validate required parameters
    if (!examId || !subject || !question) {
      ResponseUtils.badRequestResponse(res, 'Missing required query parameters: examId, subject, question');
      return;
    }

    const examIdNum = parseInt(examId as string);
    const subjectNum = parseInt(subject as string);
    const questionNum = parseInt(question as string);

    // Validate parameter types
    if (isNaN(examIdNum) || examIdNum <= 0) {
      ResponseUtils.badRequestResponse(res, 'examId must be a positive number');
      return;
    }

    if (isNaN(subjectNum) || subjectNum <= 0) {
      ResponseUtils.badRequestResponse(res, 'subject must be a positive number');
      return;
    }

    if (isNaN(questionNum) || questionNum <= 0) {
      ResponseUtils.badRequestResponse(res, 'question must be a positive number');
      return;
    }

    const userId = req.user.userId;

    // Get service instances
    const examService = ServiceFactory.getExamService();
    const questionService = ServiceFactory.getQuestionService();

    // Check if exam exists and is active
    const exam = await examService.getActiveExam(examIdNum);
    if (!exam) {
      ResponseUtils.notFoundResponse(res, 'Exam not found or not active');
      return;
    }

    // Check if student has started the exam
    const studentExam = await StudentExamService.getStudentExam(userId, examIdNum);
    if (!studentExam) {
      ResponseUtils.badRequestResponse(res, 'Please start the exam first');
      return;
    }

    if (studentExam.status === EXAM_STATUS.COMPLETED) {
      ResponseUtils.badRequestResponse(res, 'Exam already completed');
      return;
    }

    // Get the specific question with answer (if already answered)
    const lastAnsweredQuestion = await questionService.getQuestion(examIdNum, subjectNum, questionNum, userId);
    
    if (!lastAnsweredQuestion) {
      ResponseUtils.notFoundResponse(res, 'Question not found');
      return;
    }

    ResponseUtils.successResponse(res, 'Question retrieved successfully', lastAnsweredQuestion);

  } catch (error) {
    console.error('Get question error:', error);
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

    // Check if student has started the exam and it's not completed
    const studentExam = await StudentExamService.getStudentExam(userId, examId);
    if (!studentExam) {
      ResponseUtils.badRequestResponse(res, 'Please start the exam first');
      return;
    }

    if (studentExam.status === EXAM_STATUS.COMPLETED) {
      ResponseUtils.badRequestResponse(res, 'Exam already completed. Cannot submit answers.');
      return;
    }

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
      userId: user.userId,
      examId: examId,
      ...studentResult
    });

    //send whatsapp message
    // await WhatsAppService.sendWhatsAppResult(user.phoneNumber,user.userId,user.name,exam.examId,studentResult);    // Send successful response with results

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
