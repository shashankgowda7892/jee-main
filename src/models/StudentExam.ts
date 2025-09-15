import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface StudentExamAttributes {
  id: number;
  userId: number;
  examId: number;
  status: number;
  startedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StudentExamCreationAttributes extends Optional<StudentExamAttributes, 'id' | 'createdAt' | 'updatedAt'> {}
class StudentExam extends Model<StudentExamAttributes, StudentExamCreationAttributes> implements StudentExamAttributes {
  public id!: number;
  public userId!: number;
  public examId!: number;
  public status!: number;
  public startedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}


StudentExam.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        examId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: 'StudentExam',
        tableName: 'student_exams',
        timestamps: true,
    }
);

export default StudentExam;