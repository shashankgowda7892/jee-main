import { Request, Response } from 'express';
import { Exam, Question, StudentAnswer, StudentExam } from '../models';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { Op, QueryTypes } from 'sequelize';
import { EXAM_STATUS } from '../constants/ExamStatus';
import { ExamService } from '../services/examService';
import { StudentExamService } from '../services/studentExamService';
import { QuestionService } from '../services/questionService';

export const getUserExams = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try{
    const now = new Date();
    console.log(now);
    const exams = await Exam.findAll({
        where: {
            examDate: {
                [Op.lte]: now
            },
            isActive: true
        }
    });
    console.log(exams);

    res.status(200).json({
        success: true,
        data: exams
    });

  }catch(error){
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

export const startExam = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { examId } = req.body;
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const userId = req.user.userId;

    // Step 1: Check if exam exists and is active
    const exam = await ExamService.getActiveExam(examId);
    if (!exam) {
      res.status(404).json({
        success: false,
        message: 'Exam not found or not active'
      });
      return;
    }

    // Step 2: Check if exam is available (has started)
    if (!ExamService.isExamAvailable(exam)) {
      res.status(400).json({
        success: false,
        message: 'Exam has not started yet'
      });
      return;
    }

    // Step 3: Get or create student exam record
    const existingStudentExam = await StudentExamService.getStudentExam(userId, examId);
    
    if (existingStudentExam && existingStudentExam.status === EXAM_STATUS.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'Exam already completed'
      });
      return;
    }

    // Step 4: Start student exam if not already started
    const studentExam = await StudentExamService.startStudentExam(userId, examId);

    // Step 5: Get all questions with selected answers
    const questions = await QuestionService.getAllQuestionsWithAnswers(examId, userId);
    
    if (!questions || questions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No questions found for this exam'
      });
      return;
    }

    // Step 6: Send response with questions array
    res.status(200).json({
      success: true,
      message: 'Exam started successfully',
      data: questions
    });

  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

export const submitAnswer = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { examId, questionId, selectedAnswer } = req.body;
    const userId = req.user?.userId;

    if (!examId || !questionId || typeof selectedAnswer !== 'number' || !userId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Check if question exists and belongs to the exam
    const question = await Question.findOne({ where: { questionId: questionId, examId } });
    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found for this exam' });
      return;
    }

    // Check if answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;

    const studentAnswerExists = await StudentAnswer.findOne({
      where: { studentId: userId, examId, questionId }
    });

    if (studentAnswerExists) {
      // Update existing answer
      await studentAnswerExists.update({ selectedAnswer, isCorrect });
    } else {
      // Create new answer
      await StudentAnswer.create({
        studentId: userId,
        examId,
        questionId,
        selectedAnswer,
        isCorrect
      });
    }

    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully'
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const finishExam = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { examId } = req.body;
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const userId = req.user.userId;

    // Validate input
    if (!examId) {
      res.status(400).json({
        success: false,
        message: 'Missing required field: examId'
      });
      return;
    }

    // Use existing service to validate exam
    const exam = await ExamService.getActiveExam(examId);
    if (!exam) {
      res.status(404).json({
        success: false,
        message: 'Exam not found or not active'
      });
      return;
    }

    // Single SQL query to get exam results
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

    const [results] = await Question.sequelize?.query(resultQuery, {
      replacements: { examId, userId },
      type: QueryTypes.SELECT
    }) as any[];

    // Update student exam status to completed
    await StudentExamService.updateStudentExamStatus(userId, examId, EXAM_STATUS.COMPLETED);

    // Simplified response
    res.status(200).json({
      success: true,
      message: 'Exam completed successfully',
      data: {
        questionsAnswered: parseInt(results.questionsAnswered) || 0,
        notAnswered: parseInt(results.notAnswered) || 0,
        correctAnswers: parseInt(results.correctAnswers) || 0,
        wrongAnswers: parseInt(results.wrongAnswers) || 0,
        totalMarks: parseInt(results.totalMarks) || 0
      }
    });

  } catch (error) {
    console.error('Finish exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}