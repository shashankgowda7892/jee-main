const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentAnswer = sequelize.define('StudentAnswer', {
  answerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  examCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  selectedAnswer: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  }
}, {
  tableName: 'student_answers',
  timestamps: true,
  indexes: [
    {
      fields: ['studentId', 'examCode']
    },
    {
      fields: ['examCode']
    }
  ]
});

module.exports = StudentAnswer;
