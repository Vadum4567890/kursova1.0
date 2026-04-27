import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Rental } from '../entities/Rental.entity';
import { Penalty } from '../entities/Penalty.entity';
import { RentalMessage } from '../entities/RentalMessage.entity';
import { CarInquiryMessage } from '../entities/CarInquiryMessage.entity';
import { ChatReadCursor } from '../entities/ChatReadCursor.entity';
import { Review } from '../entities/Review.entity';
import { ReviewScore } from '../entities/ReviewScore.entity';

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const synchronize = process.env.DB_SYNCHRONIZE ? process.env.DB_SYNCHRONIZE === 'true' : isDevelopment;
const logging = process.env.DB_LOGGING ? process.env.DB_LOGGING === 'true' : isDevelopment;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_DATABASE || 'rental_service_db',
  synchronize,
  logging,
  entities: [Rental, Penalty, RentalMessage, CarInquiryMessage, ChatReadCursor, Review, ReviewScore],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
  subscribers: [],
});
