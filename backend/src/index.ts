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
import { registerServices } from './core/serviceRegistry';
import path from 'path';

// Load environment variables
dotenv.config();

// Register all services BEFORE importing routes (routes need services from container)
registerServices();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:3001", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, '../uploads')));

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

// Import routes AFTER services are registered
import carRoutes from './routes/carRoutes';
import clientRoutes from './routes/clientRoutes';
import rentalRoutes from './routes/rentalRoutes';
import penaltyRoutes from './routes/penaltyRoutes';
import reportRoutes from './routes/reportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import searchRoutes from './routes/searchRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
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
    // Services are already registered above (before route imports)
    
    // Connect to database
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.connect();
    
    const logger = Logger.getInstance();
    logger.log('Database connected successfully', 'info');
    logger.log('Services registered in DI container', 'info');

    // Start server with error handling for port conflicts
    const server = app.listen(PORT, () => {
      logger.log(`Server is running on port ${PORT}`, 'info');
      logger.log(`🚀 Server started at http://localhost:${PORT}`, 'info');
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.log(`❌ Port ${PORT} is already in use!`, 'error');
        logger.log(`Please free up port ${PORT} or kill the process using it.`, 'error');
        logger.log(`On Windows, you can run: netstat -ano | findstr :${PORT}`, 'info');
        logger.log(`Then kill the process: taskkill /PID <PID> /F`, 'info');
        logger.log(`Or use: npm run kill-port`, 'info');
        process.exit(1);
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

