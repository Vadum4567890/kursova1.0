import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { AppDataSource } from './database/data-source';
import { errorHandler } from './middleware/errorHandler';
import penaltyRoutes from './routes/penalty.routes';
import reportRoutes from './routes/report.routes';
import analyticsRoutes from './routes/analytics.routes';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3009;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'reporting-service', timestamp: new Date().toISOString() });
});

app.use('/api/penalties', penaltyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Reporting-service DB connected');

    app.listen(PORT, () => {
      logger.info(`Reporting Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start reporting-service', { error });
    process.exit(1);
  }
};

startServer();

export default app;

