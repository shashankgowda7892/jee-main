import { Exam } from '../models';

export class ExamService {
  /**
   * Get exam by ID if it exists and is active
   */
  static async getActiveExam(examId: number): Promise<Exam | null> {
    try {
      const exam = await Exam.findOne({
        where: {
          examId: examId,
          isActive: true
        }
      });
      return exam;
    } catch (error) {
      console.error('Error fetching exam:', error);
      throw new Error('Failed to fetch exam');
    }
  }

  /**
   * Check if exam is currently available (has started)
   */
  static isExamAvailable(exam: Exam): boolean {
    const now = new Date();
    return exam.examDate <= now;
  }

  /**
   * Get exam details for response
   */
  static getExamDetails(exam: Exam) {
    return {
      examId: exam.examId,
      duration: exam.duration,
      totalQuestions: exam.totalQuestions,
      examDate: exam.examDate
    };
  }
}
