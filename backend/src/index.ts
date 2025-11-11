import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { DatabaseConnection } from './database/DatabaseConnection';
import { Logger } from './utils/Logger';
import carRoutes from './routes/carRoutes';
import clientRoutes from './routes/clientRoutes';
import rentalRoutes from './routes/rentalRoutes';
import penaltyRoutes from './routes/penaltyRoutes';
import reportRoutes from './routes/reportRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Car Rental API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/cars', carRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/penalties', penaltyRoutes);
app.use('/api/reports', reportRoutes);

// Server initialization
async function startServer() {
  try {
    // Connect to database
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.connect();
    
    const logger = Logger.getInstance();
    logger.log('Database connected successfully', 'info');

    // Start server
    app.listen(PORT, () => {
      logger.log(`Server is running on port ${PORT}`, 'info');
      console.log(`🚀 Server started at http://localhost:${PORT}`);
    });
  } catch (error) {
    const logger = Logger.getInstance();
    logger.log(`Failed to start server: ${error}`, 'error');
    process.exit(1);
  }
}

startServer();

export default app;

