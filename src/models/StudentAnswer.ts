import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface StudentAnswerAttributes {
  answerId: number;
  studentId: number;
  examId: number;
  questionId: number;
  selectedAnswer?: number;
  isCorrect?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentAnswerCreationAttributes extends Optional<StudentAnswerAttributes, 'answerId' | 'selectedAnswer' | 'isCorrect' | 'createdAt' | 'updatedAt'> {}

class StudentAnswer extends Model<StudentAnswerAttributes, StudentAnswerCreationAttributes> implements StudentAnswerAttributes {
  public answerId!: number;
  public studentId!: number;
  public examId!: number;
  public questionId!: number;
  public selectedAnswer?: number;
  public isCorrect?: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StudentAnswer.init({
  answerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  examId: {
    type: DataTypes.INTEGER,
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
  sequelize,
  tableName: 'student_answers',
  timestamps: true,
  indexes: [
    {
      fields: ['studentId', 'examId']
    },
    {
      fields: ['examId']
    }
  ]
});

export default StudentAnswer;
