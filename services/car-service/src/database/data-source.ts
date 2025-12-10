import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Car } from '../entities/Car.entity';
import { CarPricing } from '../entities/CarPricing.entity';
import { CarFeature } from '../entities/CarFeature.entity';
import { CarAvailability } from '../entities/CarAvailability.entity';
import { CarImage } from '../entities/CarImage.entity';
import { CarDocument } from '../entities/CarDocument.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'car_service_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Car, CarPricing, CarFeature, CarAvailability, CarImage, CarDocument],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
  subscribers: [],
});

