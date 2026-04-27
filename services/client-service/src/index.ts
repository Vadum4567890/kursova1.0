import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppDataSource } from './database/data-source';
import clientRoutes from './routes/client.routes';

const PORT = Number(process.env.PORT) || 3007;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'client-service', ts: new Date().toISOString() });
});

app.use('/api/clients', clientRoutes);

async function bootstrap() {
  await AppDataSource.initialize();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`client-service on http://localhost:${PORT}`);
  });
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
