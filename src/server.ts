import { config } from 'dotenv';
config();
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { syncModels } from './models';
import routes from './routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the JEE Main Exam API' });
});

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await syncModels();
    await connectRedis();

    const PORT: number = parseInt(process.env.PORT || '3000', 10);

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
