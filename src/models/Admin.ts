import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';
import bcrypt from 'bcrypt';

interface AdminAttributes {
  adminId: number;
  emailId: string;
  password: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdminCreationAttributes extends Optional<AdminAttributes, 'adminId' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  public adminId!: number;
  public emailId!: string;
  public password!: string;
  public isActive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

Admin.init({
  adminId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  emailId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  tableName: 'admins',
  timestamps: true,
  indexes: [
    {
      fields: ['emailId']
    },
    {
      fields: ['isActive']
    }
  ]
});

export default Admin;
