import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface UserAttributes {
  userId: number;
  studentNumber: string;
  name: string;
  phoneNumber: string;
  dateOfBirth: Date;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'userId' | 'isActive' | 'lastLogin' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public userId!: number;
  public studentNumber!: string;
  public name!: string;
  public phoneNumber!: string;
  public dateOfBirth!: Date;
  public isActive!: boolean;
  public lastLogin?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['studentNumber']
    },
    {
      fields: ['userId']
    }
  ]
});

export default User;
