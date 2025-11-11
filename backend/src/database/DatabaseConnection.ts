import { DataSource } from 'typeorm';
import { Logger } from '../utils/Logger';

/**
 * Singleton Pattern для підключення до бази даних
 * Забезпечує єдине підключення для всієї системи
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private dataSource: DataSource | null = null;

  private constructor() {
    // Приватний конструктор для Singleton
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      return;
    }

    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'car_rental_db',
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      entities: [__dirname + '/../models/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../../database/migrations/**/*{.ts,.js}'],
    });

    try {
      await this.dataSource.initialize();
      const logger = Logger.getInstance();
      logger.log('Database connection established', 'info');
    } catch (error) {
      const logger = Logger.getInstance();
      logger.log(`Database connection failed: ${error}`, 'error');
      throw error;
    }
  }

  public getDataSource(): DataSource {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('Database is not initialized. Call connect() first.');
    }
    return this.dataSource;
  }

  public async disconnect(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      this.dataSource = null;
      const logger = Logger.getInstance();
      logger.log('Database connection closed', 'info');
    }
  }
}

