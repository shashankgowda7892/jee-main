const { sequelize } = require('../config/db');

const User = require('./User');
const Admin = require('./Admin');
const Exam = require('./Exam');
const Question = require('./Question');
const StudentAnswer = require('./StudentAnswer');

const syncModels = async () => {
  try {
    await sequelize.sync();
    console.log('✅ All models synced successfully');
  } catch (error) {
    console.error('❌ Model sync failed:', error);
    throw error;
  }
};

module.exports = {
  User,
  Admin,
  Exam,
  Question,
  StudentAnswer,
  syncModels,
  sequelize
};
