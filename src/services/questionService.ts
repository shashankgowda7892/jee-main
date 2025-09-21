import { QuestionDto } from '../types';
import { IQuestionRepository, QuestionRepository } from '../repositories/questionRepository';

export interface IQuestionService {
  getAllQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionDto[]>;
  getFirstQuestion(examId: number, userId: number): Promise<QuestionDto | null>;
  getQuestion(examId: number, subjectNumber: number, questionNumber: number, userId: number): Promise<QuestionDto | null>;
}

export class QuestionService implements IQuestionService {
  private questionRepository: IQuestionRepository;

  constructor(questionRepository: IQuestionRepository = new QuestionRepository()) {
    this.questionRepository = questionRepository;
  }

  /**
   * Get all questions for an exam with selected answers
   */
  async getAllQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionDto[]> {
    return await this.questionRepository.findQuestionsWithAnswers(examId, userId);
  }

  /**
   * Get first question of an exam with selected answer
   */
  async getFirstQuestion(examId: number, userId: number): Promise<QuestionDto | null> {
    return await this.questionRepository.findFirstQuestion(examId, userId);
  }

  /**
   * Get specific question by subject and question number
   */
  async getQuestion(examId: number, subjectNumber: number, questionNumber: number, userId: number): Promise<QuestionDto | null> {
    return await this.questionRepository.findQuestion(examId, subjectNumber, questionNumber, userId);
  }

  // Static method for backward compatibility
  static async getAllQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionDto[]> {
    const service = new QuestionService();
    return await service.getAllQuestionsWithAnswers(examId, userId);
  }

  // Static methods for new functionality
  static async getFirstQuestion(examId: number, userId: number): Promise<QuestionDto | null> {
    const service = new QuestionService();
    return await service.getFirstQuestion(examId, userId);
  }

  static async getQuestion(examId: number, subjectNumber: number, questionNumber: number, userId: number): Promise<QuestionDto | null> {
    const service = new QuestionService();
    return await service.getQuestion(examId, subjectNumber, questionNumber, userId);
  }
}
