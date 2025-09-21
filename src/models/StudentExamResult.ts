import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface StudentExamResultAttributes {
  resultId: number;
  userId: number;
  examId: number;
  totalQuestions: number;
  questionsAnswered: number;
  notAnswered: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalMarks: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentExamResultCreationAttributes 
  extends Optional<StudentExamResultAttributes, 'resultId' | 'createdAt' | 'updatedAt'> {}

export class StudentExamResult extends Model<StudentExamResultAttributes, StudentExamResultCreationAttributes> 
  implements StudentExamResultAttributes {
  public resultId!: number;
  public userId!: number;
  public examId!: number;
  public totalQuestions!: number;
  public questionsAnswered!: number;
  public notAnswered!: number;
  public correctAnswers!: number;
  public wrongAnswers!: number;
  public totalMarks!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StudentExamResult.init(
  {
    resultId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId',
      },
    },
    examId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'examId',
      },
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionsAnswered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notAnswered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    wrongAnswers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'student_exam_results',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'examId'],
        name: 'unique_student_exam_result'
      },
      {
        fields: ['userId']
      },
      {
        fields: ['examId']
      }
    ]
  }
);
