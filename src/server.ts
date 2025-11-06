// Load environment variables
import { config } from 'dotenv';
config();

// Import dependencies
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Import configurations and routes
import { connectDB } from './config/db';
import { syncModels } from './models';
import routes from './routes';
// import { connectRedis } from './config/redis';

// Initialize Express app
const app: Application = express();

// ===================
// Middleware Setup
// ===================
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================
// Routes
// ===================
// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to the JEE Main Exam API',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', routes);


// ===================
// Server Startup
// ===================
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting JEE Main Exam Server...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Sync database models
    await syncModels();
    console.log('✅ Database models synced');
    
    // Connect to Redis (if needed)
    // await connectRedis();
    // console.log('✅ Redis connected');

    // Start server
    const PORT: number = parseInt(process.env.PORT || '3000', 10);
    app.listen(PORT, () => {
      console.log(`🌟 Server running on http://localhost:${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
