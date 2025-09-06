const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define('Question', {
  questionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option1: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option2: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option3: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  option4: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  correctAnswer: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'questions',
  timestamps: true,
  indexes: [
    {
      fields: ['examCode']
    },
    {
      fields: ['subject']
    },
    {
      fields: ['examCode', 'subject']
    },
  ]
});

module.exports = Question;
