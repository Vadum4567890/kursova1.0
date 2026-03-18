import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Rental } from '../entities/Rental.entity';
import { Penalty } from '../entities/Penalty.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'rental_service_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Rental, Penalty],
  migrations: [],
  subscribers: [],
});
