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

const app = express();
const PORT = process.env.PORT || 3009;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

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
    // eslint-disable-next-line no-console
    console.log('Reporting-service DB connected');

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Reporting Service running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start reporting-service:', error);
    process.exit(1);
  }
};

startServer();

export default app;

