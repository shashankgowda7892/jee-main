import { Request, Response } from 'express';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { Op } from 'sequelize';
import { User, Question, Exam } from '../models';
import { ApiResponse } from '../types';

interface UploadQuestionsRequest {
  examCode: string;
  duration: string;
  totalQuestions: string;
  examDate: string;
}

interface QuestionRow {
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
    const users = await User.findAll({
      attributes: ['userId', 'studentNumber', 'name', 'phone', 'dateOfBirth', 'isActive', 'lastLogin', 'createdAt']
    });

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
    const { examCode, duration, totalQuestions, examDate }: UploadQuestionsRequest = req.body;

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }
    
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const questions: any[] = [];

    bufferStream
      .pipe(csv())
      .on("data", (row: QuestionRow) => {
        questions.push({
          examCode,
          subject: row.Subject,
          question: row.Question,
          option1: row.Option1,
          option2: row.Option2,
          option3: row.Option3,
          option4: row.Option4,
          correctAnswer: parseInt(row.CorrectAnswer),
          isActive: true
        });
      })
      .on("end", async () => {
        try {
          // Create or update exam
          await Exam.upsert({
            examCode,
            duration: parseInt(duration),
            totalQuestions: parseInt(totalQuestions),
            examDate: new Date(examDate),
            isActive: true
          });

          // Bulk create questions
          await Question.bulkCreate(questions, {
            updateOnDuplicate: ['subject', 'question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer']
          });

          res.status(200).json({
            success: true,
            message: `Successfully uploaded ${questions.length} questions for exam ${examCode}`,
            data: { uploadedCount: questions.length }
          });

        } catch (dbError) {
          console.error('Database error:', dbError);
          res.status(500).json({
            success: false,
            message: 'Error saving questions to database'
          });
        }
      })
      .on("error", (csvError) => {
        console.error('CSV parsing error:', csvError);
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file'
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

export const updateExam = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { examId, examCode, duration, totalQuestions, examDate, isActive } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
      return;
    }

    await exam.update({
      examCode,
      duration,
      totalQuestions,
      examDate: new Date(examDate),
      isActive
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
