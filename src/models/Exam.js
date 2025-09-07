const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Exam = sequelize.define('Exam', {
  examId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 180
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  examDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'exams',
  timestamps: true,
  indexes: [
    {
      fields: ['examCode']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Exam;
