import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

// Function to create database if it doesn't exist
const createDatabaseIfNotExists = async (): Promise<void> => {
  const dbName = process.env.DB_NAME as string;
  
  try {
    // Connect without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    });

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    
    console.log(`✅ Database '${dbName}' is ready`);
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error);
    throw error;
  }
};

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: (process.env.DB_DIALECT as any) || 'mysql',
    logging: true,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '30', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    // First, ensure database exists
    await createDatabaseIfNotExists();
    
    // Then authenticate with Sequelize
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export { sequelize };
