import { Exam, User, StudentAnswer, Question, sequelize } from '../models';
import { ExamDto, AppError, ErrorCodes, QuestionDto, ExamResultDto } from '../types';
import { IQuestionRepository, QuestionRepository } from '../repositories/questionRepository';
import PDFDocument from 'pdfkit';
import { QueryTypes } from 'sequelize';

export interface IExamService {
  getActiveExam(examId: number): Promise<Exam>;
  isExamAvailable(exam: Exam): boolean;
  getExamQuestions(examId: number, userId: number): Promise<QuestionDto[]>;
  calculateExamResults(examId: number, userId: number): Promise<ExamResultDto>;
  getResultPdfService(userId: number, examId: number): Promise<Buffer>;
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
   * Get questions with user's answers for PDF generation using SQL query
   */
  async getQuestionsWithAnswers(examId: number, userId: number): Promise<any[]> {
    const query = `
      SELECT 
        q.questionId,
        q.question,
        q.option1,
        q.option2,
        q.option3,
        q.option4,
        q.correctAnswer,
        q.subject,
        COALESCE(sa.selectedAnswer, 0) as selectedAnswer
      FROM questions q
      LEFT JOIN student_answers sa ON q.questionId = sa.questionId 
        AND sa.studentId = :userId 
        AND sa.examId = :examId
      WHERE q.examId = :examId
      ORDER BY q.questionId ASC
    `;

    const results = await sequelize.query(query, {
      replacements: { examId, userId },
      type: QueryTypes.SELECT
    });

    return results;
  }

  /**
   * Generate PDF result for a user's exam
   */
  async getResultPdfService(userId: number, examId: number): Promise<Buffer> {
    try {
      // Get user details by userId
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', ErrorCodes.NOT_FOUND);
      }

      // Get exam details
      const exam = await this.getActiveExam(examId);

      // Get exam results
      const results = await this.calculateExamResults(examId, userId);

      // Get questions with user answers
      const questionsWithAnswers = await this.getQuestionsWithAnswers(examId, userId);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      // Store PDF chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        doc.on('error', (error: Error) => {
          reject(error);
        });

        // Generate PDF content
        this.generatePdfContent(doc, user, exam, results, questionsWithAnswers);
        doc.end();
      });

    } catch (error) {
      console.error('Error generating PDF result:', error);
      throw new AppError('Failed to generate PDF result', ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate PDF content for exam results
   */
  private generatePdfContent(
    doc: any, 
    user: any, 
    exam: any, 
    results: ExamResultDto, 
    questionsWithAnswers: any[]
  ): void {
    // Header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('JEE MAIN EXAM RESULT', { align: 'center' });

    doc.moveDown(1);

    // Student Name from DB
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(`Student Name: ${user.name}`);

    doc.moveDown(0.5);

    // Exam Code
    doc.fontSize(14)
       .font('Helvetica')
       .text(`Exam Code: ${exam.examCode}`);

    doc.moveDown(1);

    // Results Summary
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('EXAM RESULTS:');
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Total Questions: ${results.questionsAnswered + results.notAnswered}`)
       .text(`Questions Answered: ${results.questionsAnswered}`)
       .text(`Correct Answers: ${results.correctAnswers}`)
       .text(`Wrong Answers: ${results.wrongAnswers}`)
       .text(`Not Answered: ${results.notAnswered}`)
       .text(`Total Marks: ${results.totalMarks}`);

    doc.moveDown(2);

    // Questions Section
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('DETAILED QUESTIONS:');

    doc.moveDown(1);

    // Add each question with answers
    questionsWithAnswers.forEach((questionData, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      // Question number and text
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${questionData.question}`);

      doc.moveDown(0.5);

      // Options
      doc.fontSize(11)
         .font('Helvetica')
         .text(`1. ${questionData.option1}`)
         .text(`2. ${questionData.option2}`)
         .text(`3. ${questionData.option3}`)
         .text(`4. ${questionData.option4}`);

      doc.moveDown(0.5);

      // Correct Answer
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(`Correct Answer: ${questionData.correctAnswer}`);

      // Selected Answer
      if (questionData.selectedAnswer && questionData.selectedAnswer !== 0) {
        doc.fontSize(11)
           .font('Helvetica')
           .text(`Selected Answer: ${questionData.selectedAnswer}`);
      } else {
        doc.fontSize(11)
           .font('Helvetica')
           .text('Selected Answer: (Not Answered)');
      }

      doc.moveDown(1.5);
    });

    // Footer
    doc.fontSize(8)
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 30);
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
}
