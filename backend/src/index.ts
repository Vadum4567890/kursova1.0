import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { DatabaseConnection } from './database/DatabaseConnection';
import { Logger } from './utils/Logger';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import carRoutes from './routes/carRoutes';
import clientRoutes from './routes/clientRoutes';
import rentalRoutes from './routes/rentalRoutes';
import penaltyRoutes from './routes/penaltyRoutes';
import reportRoutes from './routes/reportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import searchRoutes from './routes/searchRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Swagger UI
}));
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/penalties', penaltyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Server initialization
async function startServer() {
  try {
    // Connect to database
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.connect();
    
    const logger = Logger.getInstance();
    logger.log('Database connected successfully', 'info');

    // Start server with error handling for port conflicts
    const server = app.listen(PORT, () => {
      logger.log(`Server is running on port ${PORT}`, 'info');
      logger.log(`🚀 Server started at http://localhost:${PORT}`, 'info');
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
        logger.log(`Port ${PORT} is already in use. Trying alternative port ${portNumber + 1}...`, 'warn');
        // Try next available port
        const alternativePort = portNumber + 1;
        const altServer = app.listen(alternativePort, () => {
          logger.log(`Server is running on alternative port ${alternativePort}`, 'info');
          logger.log(`🚀 Server started at http://localhost:${alternativePort}`, 'info');
        });
        altServer.on('error', (altErr: NodeJS.ErrnoException) => {
          logger.log(`Failed to start server on alternative port: ${altErr.message}`, 'error');
          logger.log('Please free up port 3000 or set a different PORT in .env', 'error');
          process.exit(1);
        });
      } else {
        logger.log(`Server error: ${err.message}`, 'error');
        process.exit(1);
      }
    });
  } catch (error) {
    const logger = Logger.getInstance();
    logger.log(`Failed to start server: ${error}`, 'error');
    process.exit(1);
  }
}

startServer();

export default app;

