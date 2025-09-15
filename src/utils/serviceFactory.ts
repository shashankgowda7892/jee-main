import { ExamService } from '../services/examService';
import { StudentExamService } from '../services/studentExamService';
import { QuestionService } from '../services/questionService';
import { AnswerService } from '../services/answerService';
import { QuestionRepository } from '../repositories/questionRepository';
import { StudentAnswerRepository } from '../repositories/studentAnswerRepository';

/**
 * Service factory for dependency injection
 * Provides centralized service instance management
 */
export class ServiceFactory {
  private static examService: ExamService;
  private static studentExamService: StudentExamService;
  private static questionService: QuestionService;
  private static answerService: AnswerService;

  /**
   * Get Exam Service instance
   */
  static getExamService(): ExamService {
    if (!this.examService) {
      const questionRepository = new QuestionRepository();
      this.examService = new ExamService(questionRepository);
    }
    return this.examService;
  }

  /**
   * Get Student Exam Service instance
   */
  static getStudentExamService(): StudentExamService {
    if (!this.studentExamService) {
      this.studentExamService = new StudentExamService();
    }
    return this.studentExamService;
  }

  /**
   * Get Question Service instance
   */
  static getQuestionService(): QuestionService {
    if (!this.questionService) {
      const questionRepository = new QuestionRepository();
      this.questionService = new QuestionService(questionRepository);
    }
    return this.questionService;
  }

  /**
   * Get Answer Service instance
   */
  static getAnswerService(): AnswerService {
    if (!this.answerService) {
      const questionRepository = new QuestionRepository();
      const studentAnswerRepository = new StudentAnswerRepository();
      this.answerService = new AnswerService(questionRepository, studentAnswerRepository);
    }
    return this.answerService;
  }

  /**
   * Reset all service instances (useful for testing)
   */
  static reset(): void {
    this.examService = null as any;
    this.studentExamService = null as any;
    this.questionService = null as any;
    this.answerService = null as any;
  }
}
