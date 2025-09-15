import { Question, StudentAnswer } from '../models';
import { QueryTypes } from 'sequelize';
import { QuestionDto, ExamResultDto } from '../types';

export interface IQuestionRepository {
  findQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionDto[]>;
  findById(questionId: number, examId: number): Promise<Question | null>;
  getExamResults(examId: number, userId: number): Promise<ExamResultDto>;
}

export class QuestionRepository implements IQuestionRepository {
  /**
   * Get all questions for an exam with selected answers
   */
  async findQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionDto[]> {
    const query = `
      SELECT 
        q.questionId,
        q.question,
        q.option1,
        q.option2,
        q.option3,
        q.option4,
        q.subject,
        q.examId,
        COALESCE(sa.selectedAnswer, 0) as selectedAnswer
      FROM questions q
      LEFT JOIN student_answers sa ON q.questionId = sa.questionId 
        AND sa.studentId = :userId 
        AND sa.examId = :examId
      WHERE q.examId = :examId 
        AND q.isActive = 1
      ORDER BY q.subject ASC, q.questionId ASC
    `;

    const results = await Question.sequelize?.query(query, {
      replacements: { examId, userId },
      type: QueryTypes.SELECT
    }) as QuestionDto[];

    return results || [];
  }

  /**
   * Find question by ID and exam ID
   */
  async findById(questionId: number, examId: number): Promise<Question | null> {
    return await Question.findOne({
      where: {
        questionId,
        examId,
        isActive: true
      }
    });
  }

  /**
   * Get exam results using optimized query
   */
  async getExamResults(examId: number, userId: number): Promise<ExamResultDto> {
    const query = `
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

    const [result] = await Question.sequelize?.query(query, {
      replacements: { examId, userId },
      type: QueryTypes.SELECT
    }) as any[];

    return {
      questionsAnswered: parseInt(result.questionsAnswered) || 0,
      notAnswered: parseInt(result.notAnswered) || 0,
      correctAnswers: parseInt(result.correctAnswers) || 0,
      wrongAnswers: parseInt(result.wrongAnswers) || 0,
      totalMarks: parseInt(result.totalMarks) || 0
    };
  }
}
