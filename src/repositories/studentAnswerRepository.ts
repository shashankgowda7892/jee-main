import { StudentAnswer } from '../models';

export interface IStudentAnswerRepository {
  findByStudentAndQuestion(studentId: number, examId: number, questionId: number): Promise<StudentAnswer | null>;
  createOrUpdate(studentId: number, examId: number, questionId: number, selectedAnswer: number, isCorrect: boolean): Promise<void>;
}

export class StudentAnswerRepository implements IStudentAnswerRepository {
  /**
   * Find student answer by student, exam and question
   */
  async findByStudentAndQuestion(
    studentId: number, 
    examId: number, 
    questionId: number
  ): Promise<StudentAnswer | null> {
    return await StudentAnswer.findOne({
      where: {
        studentId,
        examId,
        questionId
      }
    });
  }

  /**
   * Create or update student answer
   */
  async createOrUpdate(
    studentId: number,
    examId: number,
    questionId: number,
    selectedAnswer: number,
    isCorrect: boolean
  ): Promise<void> {
    const existingAnswer = await this.findByStudentAndQuestion(studentId, examId, questionId);

    if (existingAnswer) {
      await existingAnswer.update({ selectedAnswer, isCorrect });
    } else {
      await StudentAnswer.create({
        studentId,
        examId,
        questionId,
        selectedAnswer,
        isCorrect
      });
    }
  }
}
