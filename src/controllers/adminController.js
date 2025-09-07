const { Readable } = require("stream");
const csv = require("csv-parser");
const { Op } = require('sequelize');
const { User,Question,Exam } = require('../models');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();

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

const uploadQuestions = async (req, res) => {
  try {
    const { examCode, duration, totalQuestions, examDate } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const questions = [];

    bufferStream
      .pipe(csv())
      .on("data", (row) => {
        questions.push({
          examCode,
          subject: row.Subject,
          question: row.Question,
          option1: row.Option1,
          option2: row.Option2,
          option3: row.Option3,
          option4: row.Option4,
          correctAnswer: row.CorrectAnswer,
        });
      })
      .on('end', async () => {
        await Exam.create({
          examCode,
          duration,
          totalQuestions,
          examDate
        });
        const insertedQuestions = await Question.bulkCreate(questions);

        res.status(200).json({
          success: true,
          message: 'Questions uploaded successfully',
          totalInserted: insertedQuestions.length
        });
      });
  } catch (error) {
    console.error('Error uploading questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getExams = async (req, res) => {
  try {

    const {search} = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const exams = await Exam.findAll({
      offset,
      limit,
      order: [
      ['examDate', 'DESC']
      ],
      where:search ? {
        examCode: {
          [Op.like]: `%${search}%`
        }
      } : {}
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

const updateExam = async (req, res) => {
  try {
    const { examId, ...updateData } = req.body;

    await Exam.update(updateData, {
      where: { examId }
    });

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully'
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUsers,
  uploadQuestions,
  getExams,
  updateExam
};
