import { QuestionDto } from '../types';
import { IQuestionRepository, QuestionRepository } from '../repositories/questionRepository';

export interface IQuestionService {
  getAllQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionDto[]>;
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

  // Static method for backward compatibility
  static async getAllQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionDto[]> {
    const service = new QuestionService();
    return await service.getAllQuestionsWithAnswers(examId, userId);
  }
}
