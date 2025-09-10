import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface ExamAttributes {
  examId: number;
  examCode: string;
  duration: number;
  totalQuestions: number;
  examDate: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExamCreationAttributes extends Optional<ExamAttributes, 'examId' | 'duration' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Exam extends Model<ExamAttributes, ExamCreationAttributes> implements ExamAttributes {
  public examId!: number;
  public examCode!: string;
  public duration!: number;
  public totalQuestions!: number;
  public examDate!: Date;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exam.init({
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
  sequelize,
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

export default Exam;
