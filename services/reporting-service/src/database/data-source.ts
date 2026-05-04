import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Rental } from '../entities/Rental.entity';
import { Penalty } from '../entities/Penalty.entity';

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const synchronize = false;
const logging = process.env.DB_LOGGING ? process.env.DB_LOGGING === 'true' : isDevelopment;

// IMPORTANT: reporting-service shares rental_service_db in READ-ONLY mode
// This service does NOT own the schema - rental-service owns it
// Policy: read-only access to rentals and penalties tables
// Future: consider read replica or materialized views for heavy reports
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'rental_service_db',
  synchronize,
  logging,
  entities: [Rental, Penalty],
  migrations: [],
  subscribers: [],
});
