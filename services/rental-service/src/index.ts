import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { AppDataSource } from './database/data-source';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import rentalRoutes from './routes/rental.routes';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rental-service', timestamp: new Date().toISOString() });
});

app.use('/api/rentals', rentalRoutes);
app.use(errorHandler);

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info(`Rental Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();
