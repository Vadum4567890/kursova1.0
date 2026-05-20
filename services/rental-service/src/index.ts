import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { AppDataSource } from './database/data-source';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import rentalRoutes from './routes/rental.routes';
import { RentalController } from './controllers/RentalController';
import { auth, AuthRequest } from './middleware/auth';
import { attachChatWebSocket } from './ws/chatWebSocket';

const app = express();
const PORT = process.env.PORT || 3004;

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rental-service', timestamp: new Date().toISOString() });
});

/** Контакт орендодавця та inquiry-чат: повний шлях на app, щоб POST/GET стабільно збігались (без «Cannot POST» від mount). */
const rentalController = new RentalController();
app.get('/api/rentals/car/:carId/landlord-contact', auth, (req: AuthRequest, res, next) =>
  rentalController.getLandlordContactForCar(req, res, next)
);
app.get('/api/rentals/car/:carId/inquiry-renter-contact', auth, (req: AuthRequest, res, next) =>
  rentalController.getInquiryRenterContactForCar(req, res, next)
);
app.get('/api/rentals/car/:carId/inquiry-threads', auth, (req: AuthRequest, res, next) =>
  rentalController.getCarInquiryThreads(req, res, next)
);
app.get('/api/rentals/car/:carId/inquiry-messages', auth, (req: AuthRequest, res, next) =>
  rentalController.getCarInquiryMessages(req, res, next)
);
app.post('/api/rentals/car/:carId/inquiry-messages', auth, (req: AuthRequest, res, next) =>
  rentalController.postCarInquiryMessage(req, res, next)
);

app.use('/api/rentals', rentalRoutes);
app.use(errorHandler);

const CHAT_WS_PATH = '/api/rentals/ws';

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected');

    if (process.env.DB_RUN_MIGRATIONS === 'true') {
      const migrations = await AppDataSource.runMigrations();
      logger.info(`Database migrations applied: ${migrations.length}`);
    }

    const server = http.createServer(app);
    attachChatWebSocket(server, CHAT_WS_PATH);

    server.listen(PORT, () => {
      logger.info(`Rental Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
