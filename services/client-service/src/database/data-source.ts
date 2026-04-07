import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Client } from '../entities/Client.entity';

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const synchronize = process.env.DB_SYNCHRONIZE ? process.env.DB_SYNCHRONIZE === 'true' : isDevelopment;
const logging = process.env.DB_LOGGING ? process.env.DB_LOGGING === 'true' : isDevelopment;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'client_service_db',
  synchronize,
  logging,
  entities: [Client],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
});
