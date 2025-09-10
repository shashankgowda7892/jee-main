import { sequelize } from '../config/db';

import User from '../models/User';
import Admin from '../models/Admin';
import Exam from '../models/Exam';
import Question from '../models/Question';
import StudentAnswer from '../models/StudentAnswer';

export const syncModels = async (): Promise<void> => {
  try {
    await sequelize.sync();
    console.log('✅ All models synced successfully');
  } catch (error) {
    console.error('❌ Model sync failed:', error);
    throw error;
  }
};

export {
  User,
  Admin,
  Exam,
  Question,
  StudentAnswer,
  sequelize
};
