/**
 * Singleton Pattern для логування
 * Забезпечує централізоване логування для всієї системи
 */
export class Logger {
  private static instance: Logger;

  private constructor() {
    // Приватний конструктор для Singleton
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(message: string, level: 'info' | 'error' | 'warn' | 'debug' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage);
        }
        break;
      default:
        console.log(logMessage);
    }
  }

  public info(message: string): void {
    this.log(message, 'info');
  }

  public error(message: string): void {
    this.log(message, 'error');
  }

  public warn(message: string): void {
    this.log(message, 'warn');
  }

  public debug(message: string): void {
    this.log(message, 'debug');
  }
}

