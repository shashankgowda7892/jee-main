import { StudentExam, StudentAnswer } from '../models';
import { EXAM_STATUS } from '../constants/ExamStatus';

export class StudentExamService {
  /**
   * Get existing student exam record
   */
  static async getStudentExam(userId: number, examId: number): Promise<StudentExam | null> {
    try {
      const studentExam = await StudentExam.findOne({
        where: {
          userId: userId,
          examId: examId
        }
      });
      return studentExam;
    } catch (error) {
      console.error('Error fetching student exam:', error);
      throw new Error('Failed to fetch student exam');
    }
  }

  /**
   * Create or update student exam record to ACTIVE status
   */
  static async startStudentExam(userId: number, examId: number): Promise<void> {
    try {
      const existingStudentExam = await this.getStudentExam(userId, examId);

      if (existingStudentExam) {
        return;
      } else {
        // Create new student exam record
        const newStudentExam = await StudentExam.create({
          userId: userId,
          examId: examId,
          status: EXAM_STATUS.ACTIVE,
          startedAt: new Date()
        });
        return;
      }
    } catch (error) {
      console.error('Error starting student exam:', error);
      throw new Error('Failed to start student exam');
    }
  }

  /**
   * Get last answered question for a student in an exam
   */
  static async getLastAnsweredQuestion(userId: number, examId: number): Promise<StudentAnswer | null> {
    try {
      const lastStudentAnswer = await StudentAnswer.findOne({
        where: {
          studentId: userId,
          examId: examId
        },
        order: [['answerId', 'DESC']]
      });
      return lastStudentAnswer;
    } catch (error) {
      console.error('Error fetching last answered question:', error);
      throw new Error('Failed to fetch last answered question');
    }
  }

  /**
   * Check if student has started the exam
   */
  static hasStudentStartedExam(studentExam: StudentExam | null): boolean {
    return studentExam !== null && studentExam.status === EXAM_STATUS.ACTIVE;
  }

  /**
   * Get student exam details for response
   */
  static getStudentExamDetails(studentExam: StudentExam) {
    return {
      status: studentExam.status,
      startedAt: studentExam.startedAt
    };
  }

  /**
   * Update student exam status
   */
  static async updateStudentExamStatus(userId: number, examId: number, status: number): Promise<void> {
    try {
      await StudentExam.update(
        { status: status },
        { 
          where: { 
            userId: userId, 
            examId: examId 
          } 
        }
      );
    } catch (error) {
      console.error('Error updating student exam status:', error);
      throw new Error('Failed to update student exam status');
    }
  }
}
