import { Exam } from '../models';
import { ExamDto, AppError, ErrorCodes, QuestionDto, ExamResultDto } from '../types';
import { IQuestionRepository, QuestionRepository } from '../repositories/questionRepository';

export interface IExamService {
  getActiveExam(examId: number): Promise<Exam>;
  isExamAvailable(exam: Exam): boolean;
  getExamQuestions(examId: number, userId: number): Promise<QuestionDto[]>;
  calculateExamResults(examId: number, userId: number): Promise<ExamResultDto>;
}

export class ExamService implements IExamService {
  private questionRepository: IQuestionRepository;

  constructor(questionRepository: IQuestionRepository = new QuestionRepository()) {
    this.questionRepository = questionRepository;
  }

  /**
   * Get exam by ID if it exists and is active
   */
  async getActiveExam(examId: number): Promise<Exam> {
    const exam = await Exam.findOne({
      where: {
        examId: examId,
        isActive: true
      }
    });

    if (!exam) {
      throw new AppError('Exam not found or not active', ErrorCodes.NOT_FOUND);
    }

    return exam;
  }

  /**
   * Check if exam is currently available (has started)
   */
  isExamAvailable(exam: Exam): boolean {
    const now = new Date();
    return exam.examDate <= now;
  }

  /**
   * Get all questions for an exam with answers
   */
  async getExamQuestions(examId: number, userId: number): Promise<QuestionDto[]> {
    const questions = await this.questionRepository.findQuestionsWithAnswers(examId, userId);
    
    if (!questions || questions.length === 0) {
      throw new AppError('No questions found for this exam', ErrorCodes.NOT_FOUND);
    }

    return questions;
  }

  /**
   * Calculate exam results
   */
  async calculateExamResults(examId: number, userId: number): Promise<ExamResultDto> {
    return await this.questionRepository.getExamResults(examId, userId);
  }

  /**
   * Get exam details for response
   */
  static getExamDetails(exam: Exam): ExamDto {
    return {
      examId: exam.examId,
      duration: exam.duration,
      totalQuestions: exam.totalQuestions,
      examDate: exam.examDate,
      isActive: exam.isActive
    };
  }

  // Static methods for backward compatibility
  static async getActiveExam(examId: number): Promise<Exam | null> {
    try {
      const service = new ExamService();
      return await service.getActiveExam(examId);
    } catch (error) {
      return null;
    }
  }

  static isExamAvailable(exam: Exam): boolean {
    const service = new ExamService();
    return service.isExamAvailable(exam);
  }
}
