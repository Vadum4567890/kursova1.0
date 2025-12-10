import { Request, Response, NextFunction } from 'express';
import { CarService } from '../services/CarService';
import { CreateCarDto } from '../dto/CreateCarDto';
import { CreatePricingDto } from '../dto/CreatePricingDto';
import { SearchCarsDto } from '../dto/SearchCarsDto';
import { validateDto } from '../middleware/validation';
import { UserServiceClient } from '../services/UserServiceClient';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export class CarController {
  private carService: CarService;

  constructor() {
    this.carService = new CarService();
  }

  createCar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const carData = await validateDto(CreateCarDto, req.body);
      
      // Set ownerId from authenticated user
      carData.ownerId = req.userId || carData.ownerId;

      const car = await this.carService.createCar(carData);
      
      res.status(201).json({
        success: true,
        data: car,
      });
    } catch (error) {
      next(error);
    }
  };

  getCarById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const car = await this.carService.getCarById(id);

      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      // Отримати інформацію про власника з User Service
      const userServiceClient = new UserServiceClient();
      const owner = await userServiceClient.getUserById(car.ownerId);
      const ownerProfile = await userServiceClient.getUserProfile(car.ownerId);

      res.json({
        success: true,
        data: {
          ...car,
          owner: owner ? {
            id: owner.id,
            email: owner.email,
            role: owner.role,
            profile: ownerProfile,
          } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = await validateDto(SearchCarsDto, req.query);
      const cars = await this.carService.getAllCars(filters);

      res.json({
        success: true,
        data: cars,
        count: cars.length,
      });
    } catch (error) {
      next(error);
    }
  };

  getCarsByOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.userId || req.params.ownerId;
      const cars = await this.carService.getCarsByOwner(ownerId);

      res.json({
        success: true,
        data: cars,
        count: cars.length,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Verify ownership (should be in middleware)
      const car = await this.carService.getCarById(id);
      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      if (car.ownerId !== req.userId) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden: You can only update your own cars' },
        });
        return;
      }

      const updated = await this.carService.updateCar(id, req.body);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Verify ownership
      const car = await this.carService.getCarById(id);
      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      if (car.ownerId !== req.userId) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden: You can only delete your own cars' },
        });
        return;
      }

      await this.carService.deleteCar(id);

      res.json({
        success: true,
        message: 'Car deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  addImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { imageUrl, isPrimary, displayOrder } = req.body;

      // Verify ownership
      const car = await this.carService.getCarById(id);
      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      if (car.ownerId !== req.userId) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden' },
        });
        return;
      }

      const image = await this.carService.addImage(id, {
        imageUrl,
        isPrimary: isPrimary || false,
        displayOrder: displayOrder || 0,
      });

      res.status(201).json({
        success: true,
        data: image,
      });
    } catch (error) {
      next(error);
    }
  };

  getCarImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const images = await this.carService.getCarImages(id);

      res.json({
        success: true,
        data: images,
        count: images.length,
      });
    } catch (error) {
      next(error);
    }
  };

  setPrimaryImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, imageId } = req.params;

      // Verify ownership
      const car = await this.carService.getCarById(id);
      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      if (car.ownerId !== req.userId) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden' },
        });
        return;
      }

      await this.carService.setPrimaryImage(id, imageId);

      res.json({
        success: true,
        message: 'Primary image updated',
      });
    } catch (error) {
      next(error);
    }
  };

  updatePricing = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const pricingData = await validateDto(CreatePricingDto, req.body);

      // Verify ownership
      const car = await this.carService.getCarById(id);
      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      if (car.ownerId !== req.userId) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden' },
        });
        return;
      }

      const pricing = await this.carService.updatePricing(id, pricingData);

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      next(error);
    }
  };

  searchCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchParams = await validateDto(SearchCarsDto, req.query);
      
      // If location provided, use location search
      if (searchParams.latitude && searchParams.longitude) {
        const cars = await this.carService.getCarsByLocation(
          searchParams.latitude,
          searchParams.longitude,
          searchParams.radiusKm || 10
        );
        res.json({
          success: true,
          data: cars,
          count: cars.length,
        });
        return;
      }

      // Otherwise use regular search
      const cars = await this.carService.getAllCars(searchParams);

      res.json({
        success: true,
        data: cars,
        count: cars.length,
      });
    } catch (error) {
      next(error);
    }
  };
}

