import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { UserProfile } from '../entities/UserProfile.entity';
import { UserDocument } from '../entities/UserDocument.entity';
import { UserRating } from '../entities/UserRating.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'car_rental_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, UserProfile, UserDocument, UserRating],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
  subscribers: [],
});

