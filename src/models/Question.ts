import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface QuestionAttributes {
  questionId: number;
  examId: number;
  subject: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'questionId' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
  public questionId!: number;
  public examId!: number;
  public subject!: number;
  public question!: string;
  public option1!: string;
  public option2!: string;
  public option3!: string;
  public option4!: string;
  public correctAnswer!: number;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Question.init({
  questionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subject: {
    type: DataTypes.INTEGER,
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
  sequelize,
  tableName: 'questions',
  timestamps: true,
  indexes: [
    {
      fields: ['examId']
    },
    {
      fields: ['subject']
    },
    {
      fields: ['examId', 'subject']
    },
  ]
});

export default Question;
