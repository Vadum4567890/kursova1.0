import { Request, Response } from 'express';
import { CarService } from '../services/CarService';
import { CarType, CarStatus } from '../models/Car.entity';

/**
 * Controller for car-related endpoints
 */
export class CarController {
  private carService: CarService;

  constructor() {
    this.carService = new CarService();
  }

  /**
   * GET /api/cars - Get all cars with pagination and filtering
   */
  getAllCars = async (req: Request, res: Response): Promise<void> => {
    try {
      const pagination = req.pagination;
      const filters = req.filters || {};
      const sort = req.sort || { field: 'id', order: 'ASC' };
      
      const result = await this.carService.getAllCars(pagination, filters, sort);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/cars/available - Get available cars with pagination
   */
  getAvailableCars = async (req: Request, res: Response): Promise<void> => {
    try {
      const pagination = req.pagination;
      const filters = req.filters || {};
      const sort = req.sort || { field: 'id', order: 'ASC' };
      
      const result = await this.carService.getAvailableCars(pagination, filters, sort);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/cars/:id - Get car by ID
   */
  getCarById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }
      
      const car = await this.carService.getCarById(id);
      
      if (!car) {
        res.status(404).json({ error: 'Car not found' });
        return;
      }
      
      res.json(car);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/cars/type/:type - Get cars by type
   */
  getCarsByType = async (req: Request, res: Response): Promise<void> => {
    try {
      const type = req.params.type as CarType;
      if (!Object.values(CarType).includes(type)) {
        res.status(400).json({ error: `Invalid car type. Must be one of: ${Object.values(CarType).join(', ')}` });
        return;
      }
      
      const pagination = req.pagination;
      const result = await this.carService.getCarsByType(type, pagination);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/cars - Create a new car
   */
  createCar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, ...carData } = req.body;
      const carType = type || CarType.ECONOMY;
      const car = await this.carService.createCar(carData, carType);
      res.status(201).json({ data: car });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * PUT /api/cars/:id - Update car
   */
  updateCar = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const car = await this.carService.updateCar(id, req.body);
      res.json({ data: car });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * DELETE /api/cars/:id - Delete car
   */
  deleteCar = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const success = await this.carService.deleteCar(id);
      
      if (!success) {
        res.status(404).json({ error: 'Car not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      // Check if it's a foreign key constraint error
      if (error.message && error.message.includes('active rental')) {
        res.status(400).json({ error: error.message });
      } else if (error.message && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || 'Failed to delete car' });
      }
    }
  };

  /**
   * PATCH /api/cars/:id/status - Update car status
   */
  updateCarStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!Object.values(CarStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      
      const car = await this.carService.updateCarStatus(id, status);
      res.json(car);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /api/cars/:id/booked-dates - Get booked dates for a car
   */
  getBookedDates = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { RentalService } = await import('../services/RentalService');
      const rentalService = new RentalService();
      const bookedDates = await rentalService.getBookedDates(id);
      res.json(bookedDates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

