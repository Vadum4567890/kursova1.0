import 'reflect-metadata';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { AppDataSource } from './database/data-source';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'car-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
import carRoutes from './routes/car.routes';
app.use('/api/cars', carRoutes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info(`Car Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();

