import { DataSource } from 'typeorm';
import { Car } from '../models/Car.entity';
import { Client } from '../models/Client.entity';
import { Rental } from '../models/Rental.entity';
import { Penalty } from '../models/Penalty.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'car_rental_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Car, Client, Rental, Penalty],
  migrations: [__dirname + '/../../database/migrations/**/*{.ts,.js}'],
  subscribers: [],
});

