import { Question, StudentAnswer } from '../models';
import { QueryTypes } from 'sequelize';

export interface QuestionResponse {
  questionId: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  subject: string;
  examId: number;
  selectedAnswer: number; // 0 if not answered, 1-4 if answered
}

export class QuestionService {
  /**
   * Get all questions for an exam with selected answers using SQL query
   */
  static async getAllQuestionsWithAnswers(examId: number, userId: number): Promise<QuestionResponse[]> {
    try {
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
      }) as QuestionResponse[];

      return results || [];
    } catch (error) {
      console.error('Error fetching questions with answers:', error);
      throw new Error('Failed to fetch questions with answers');
    }
  }
}
