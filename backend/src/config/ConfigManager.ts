/**
 * Singleton Pattern для управління конфігурацією
 * Централізоване зберігання та доступ до налаштувань
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Record<string, any>;

  private constructor() {
    this.config = {
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'car_rental_db',
      },
      app: {
        port: parseInt(process.env.PORT || '3000'),
        nodeEnv: process.env.NODE_ENV || 'development',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      },
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      },
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public get(key: string): any {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  public getDatabaseConfig() {
    return this.config.database;
  }

  public getAppConfig() {
    return this.config.app;
  }

  public getJwtConfig() {
    return this.config.jwt;
  }

  public getCorsConfig() {
    return this.config.cors;
  }
}

