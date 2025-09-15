import { AppError, ErrorCodes } from '../types';
import { IQuestionRepository, QuestionRepository } from '../repositories/questionRepository';
import { IStudentAnswerRepository, StudentAnswerRepository } from '../repositories/studentAnswerRepository';

export interface IAnswerService {
  submitAnswer(userId: number, examId: number, questionId: number, selectedAnswer: number): Promise<boolean>;
}

export class AnswerService implements IAnswerService {
  private questionRepository: IQuestionRepository;
  private studentAnswerRepository: IStudentAnswerRepository;

  constructor(
    questionRepository: IQuestionRepository = new QuestionRepository(),
    studentAnswerRepository: IStudentAnswerRepository = new StudentAnswerRepository()
  ) {
    this.questionRepository = questionRepository;
    this.studentAnswerRepository = studentAnswerRepository;
  }

  /**
   * Submit answer for a question
   */
  async submitAnswer(
    userId: number,
    examId: number,
    questionId: number,
    selectedAnswer: number
  ): Promise<boolean> {
    // Check if question exists
    const question = await this.questionRepository.findById(questionId, examId);
    if (!question) {
      throw new AppError('Question not found for this exam', ErrorCodes.NOT_FOUND);
    }

    // Check if answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;

    // Save or update student answer
    await this.studentAnswerRepository.createOrUpdate(
      userId,
      examId,
      questionId,
      selectedAnswer,
      isCorrect
    );

    return isCorrect;
  }
}
