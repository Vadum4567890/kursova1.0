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
   * GET /api/cars - Get all cars
   */
  getAllCars = async (req: Request, res: Response): Promise<void> => {
    try {
      const cars = await this.carService.getAllCars();
      res.json(cars);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/cars/available - Get available cars
   */
  getAvailableCars = async (req: Request, res: Response): Promise<void> => {
    try {
      const cars = await this.carService.getAvailableCars();
      res.json(cars);
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
      const cars = await this.carService.getCarsByType(type);
      res.json(cars);
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
      res.status(201).json(car);
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
      res.json(car);
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
      res.status(500).json({ error: error.message });
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
}

