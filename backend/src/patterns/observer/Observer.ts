import { Rental, RentalStatus } from '../../models/Rental.entity';
import { Car, CarStatus } from '../../models/Car.entity';
import { Logger } from '../../utils/Logger';

/**
 * Observer Pattern for notifying about rental status changes
 * Allows loose coupling between rental management and notification systems
 */

/**
 * Observer interface
 */
export interface Observer {
  update(event: string, data: any): void;
}

/**
 * Subject interface
 */
export interface Subject {
  attach(observer: Observer): void;
  detach(observer: Observer): void;
  notify(event: string, data: any): void;
}

/**
 * Rental subject - notifies observers about rental changes
 */
export class RentalSubject implements Subject {
  private observers: Observer[] = [];
  private rental: Rental;

  constructor(rental: Rental) {
    this.rental = rental;
  }

  public attach(observer: Observer): void {
    this.observers.push(observer);
  }

  public detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  public notify(event: string, data: any): void {
    for (const observer of this.observers) {
      observer.update(event, data);
    }
  }

  public setStatus(status: RentalStatus): void {
    const oldStatus = this.rental.status;
    this.rental.status = status;
    this.notify('status_changed', {
      rental: this.rental,
      oldStatus,
      newStatus: status,
    });
  }

  public complete(): void {
    this.setStatus(RentalStatus.COMPLETED);
    this.notify('rental_completed', {
      rental: this.rental,
    });
  }

  public cancel(): void {
    this.setStatus(RentalStatus.CANCELLED);
    this.notify('rental_cancelled', {
      rental: this.rental,
    });
  }
}

/**
 * Car status observer - updates car status based on rental changes
 */
export class CarStatusObserver implements Observer {
  public update(event: string, data: any): void {
    if (event === 'status_changed') {
      const { rental, newStatus } = data;
      
      if (rental?.car) {
        if (newStatus === RentalStatus.ACTIVE) {
          // Car becomes rented
          rental.car.status = CarStatus.RENTED;
        } else if (newStatus === RentalStatus.COMPLETED || 
                   newStatus === RentalStatus.CANCELLED) {
          // Car becomes available
          rental.car.status = CarStatus.AVAILABLE;
        }
      }
    }
  }
}

/**
 * Notification observer - sends notifications
 */
export class NotificationObserver implements Observer {
  public update(event: string, data: any): void {
    if (event === 'rental_completed') {
      const { rental } = data;
      // In real implementation, this would send email/SMS
      // Notification would be sent here (email, SMS, etc.)
      // For now, just log it
      const logger = Logger.getInstance();
      logger.log(`Sending notification to client ${rental.client?.fullName || 'Unknown'}`, 'info');
    } else if (event === 'rental_cancelled') {
      const { rental } = data;
      // Cancellation notification would be sent here
      const logger = Logger.getInstance();
      logger.log(`Sending cancellation notification to client ${rental.client?.fullName || 'Unknown'}`, 'info');
    }
  }
}

/**
 * Logging observer - logs all events
 */
export class LoggingObserver implements Observer {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  public update(event: string, data: any): void {
    this.logger.log(`Event: ${event}, Data: ${JSON.stringify(data)}`, 'info');
  }
}

