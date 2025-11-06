import { Request, Response } from 'express';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { Op, QueryTypes } from 'sequelize';
import { User, Question, Exam, StudentExamResult } from '../models';
import { ApiResponse, GetExamRequest } from '../types';
import { ResponseUtils } from '../utils/responseUtils';

interface UploadQuestionsRequest {
  examCode: string;
  duration: string;
  totalQuestions: string;
  examDate: string;
}

interface QuestionRow {
  examId: number;
  Subject: string;
  Question: string;
  Option1: string;
  Option2: string;
  Option3: string;
  Option4: string;
  CorrectAnswer: string;
}

export const getUsers = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const users = await User.findAll({});

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const uploadQuestions = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {

    console.log(req.body);
    const { examCode, duration, totalQuestions, examDate }: UploadQuestionsRequest = req.body;

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    // Create or update exam
    const [exam] = await Exam.upsert({
      examCode,
      duration: parseInt(duration),
      totalQuestions: parseInt(totalQuestions),
      examDate: new Date(examDate),
      isActive: true
    });
    
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const questions: any[] = [];

    bufferStream
      .pipe(csv({
        separator: ',',
        quote: '"',
        escape: '"'
      }))
      .on("data", (row: QuestionRow) => {
        // Validate and clean the data
        if (!row.Subject || !row.Question || !row.Option1 || !row.Option2 || 
            !row.Option3 || !row.Option4 || !row.CorrectAnswer) {
          console.warn('Skipping row with missing data:', row);
          return;
        }

        // Validate correct answer
        const correctAnswer = parseInt(row.CorrectAnswer);
        if (isNaN(correctAnswer) || correctAnswer < 1 || correctAnswer > 4) {
          console.warn('Skipping row with invalid correct answer:', row.CorrectAnswer);
          return;
        }

        questions.push({
          examId: exam.examId,
          subject: row.Subject.trim(),
          question: row.Question.trim(),
          option1: row.Option1.trim(),
          option2: row.Option2.trim(),
          option3: row.Option3.trim(),
          option4: row.Option4.trim(),
          correctAnswer: correctAnswer,
          isActive: true
        });
      })
      .on("end", async () => {
        try {
          if (questions.length === 0) {
            res.status(400).json({
              success: false,
              message: 'No valid questions found in the CSV file. Please check the format and ensure all required fields are present.'
            });
            return;
          }

          // Bulk create questions
          await Question.bulkCreate(questions, {
            updateOnDuplicate: ['subject', 'question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer']
          });

          res.status(200).json({
            success: true,
            message: `Successfully uploaded ${questions.length} questions for exam ${examCode}`,
            data: { 
              uploadedCount: questions.length,
              examId: exam.examId,
              examCode: examCode
            }
          });

        } catch (dbError) {
          console.error('Database error:', dbError);
          res.status(500).json({
            success: false,
            message: 'Error saving questions to database: ' + (dbError as Error).message
          });
        }
      })
      .on("error", (csvError) => {
        console.error('CSV parsing error:', csvError);
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file. Please ensure the file is properly formatted with quoted fields containing commas.',
          error: csvError.message
        });
      });

  } catch (error) {
    console.error('Upload questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getExams = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const exams = await Exam.findAll({
      where: { isActive: true },
      order: [['examDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: exams
    });

  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const  updateExam = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { examId, ...updateData } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
      return;
    }

    await exam.update({
      ...updateData
    });

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      data: exam
    });

  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getExamResult = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { examId }: GetExamRequest = req.query as any;

    const query = `
    select u.name,u.studentNumber,er.totalQuestions,er.correctAnswers,er.notAnswered,er.wrongAnswers,er.totalMarks from student_exam_results er
    join users u on er.userId=u.userId
    where er.examId=:examId
    order by er.totalMarks desc`
    
     const results = await Question.sequelize?.query(query, {
      replacements: { examId },
      type: QueryTypes.SELECT
     }) as [];
    
    ResponseUtils.successResponse(res, "Student Performance", results);

  } catch (error) {
    console.error('Error fetching exam results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};