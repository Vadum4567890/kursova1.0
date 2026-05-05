import { Request, Response, NextFunction } from 'express';
import { CarService } from '../services/CarService';
import { CreateCarDto } from '../dto/CreateCarDto';
import { CreatePricingDto } from '../dto/CreatePricingDto';
import { SearchCarsDto } from '../dto/SearchCarsDto';
import { validateDto } from '../middleware/validation';
import { UserServiceClient } from '../services/UserServiceClient';
import { CarCategory, CarStatus } from '../entities/Car.entity';
import { isValidServiceKey } from '../utils/serviceKey';

const ALLOWED_STATUS_UPDATE = [CarStatus.ACTIVE, CarStatus.RENTED, CarStatus.MAINTENANCE];

/** Query string дає рядки; після validate + implicit conversion — page/limit → offset */
function searchDtoToFindAllFilters(dto: SearchCarsDto) {
  const { page, limit, offset: dtoOffset, brand, model, ...criteria } = dto;
  let offset = dtoOffset;
  if (page != null && limit != null) {
    offset = (page - 1) * limit;
  }
  return { ...criteria, brand, model, limit, offset };
}

function resolvePageMeta(dto: SearchCarsDto, total: number) {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? total ?? 1;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  return { page, limit, totalPages };
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export class CarController {
  private carService: CarService;

  constructor() {
    this.carService = new CarService();
  }

  private canManageCar(req: AuthRequest, ownerId: string): boolean {
    return req.userRole === 'admin' || ownerId === req.userId;
  }

  createCar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await validateDto(CreateCarDto, req.body);
      const { dailyRate, depositAmount, ...carFields } = dto;

      const pricing =
        dailyRate !== undefined
          ? {
              dailyRate,
              depositAmount: depositAmount ?? 0,
              depositRequired: (depositAmount ?? 0) > 0,
              currency: 'UAH' as const,
            }
          : undefined;

      const car = await this.carService.createCar(
        {
          ...carFields,
          ownerId: req.userId,
        },
        pricing
      );

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

      let ownerPayload: {
        id: string;
        email?: string;
        role?: string;
        profile: unknown;
      } | null = null;
      try {
        const userServiceClient = new UserServiceClient();
        const owner = await userServiceClient.getUserById(car.ownerId);
        const ownerProfile = await userServiceClient.getUserProfile(car.ownerId);
        ownerPayload = owner
          ? {
              id: owner.id,
              email: owner.email,
              role: owner.role,
              profile: ownerProfile,
            }
          : null;
      } catch {
        ownerPayload = null;
      }

      res.json({
        success: true,
        data: {
          ...car,
          owner: ownerPayload,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await validateDto(SearchCarsDto, req.query);
      const result = await this.carService.getAllCars(searchDtoToFindAllFilters(dto));
      const meta = resolvePageMeta(dto, result.total);

      res.json({
        success: true,
        data: result.items,
        count: result.items.length,
        total: result.total,
        page: meta.page,
        limit: meta.limit,
        totalPages: meta.totalPages,
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

      if (!this.canManageCar(req, car.ownerId)) {
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

      if (!this.canManageCar(req, car.ownerId)) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden: You can only delete your own cars' },
        });
        return;
      }

      if (car.status === CarStatus.DELETED) {
        res.status(404).json({
          success: false,
          error: { message: 'Car already deleted' },
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

      if (!this.canManageCar(req, car.ownerId)) {
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

  syncImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const images = Array.isArray(req.body?.images) ? req.body.images : [];

      const car = await this.carService.getCarById(id);
      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      if (!this.canManageCar(req, car.ownerId)) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden' },
        });
        return;
      }

      const synced = await this.carService.syncImages(id, images);

      res.json({
        success: true,
        data: synced,
        count: synced.length,
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

  getCarRating = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rating = await this.carService.getCarRating(req.params.id);
      res.json({ success: true, data: rating });
    } catch (error) {
      next(error);
    }
  };

  incrementCompletedRentals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serviceKey = req.headers['x-service-key'] as string;
      if (!isValidServiceKey(serviceKey)) {
        res.status(403).json({ success: false, error: { message: 'Forbidden' } });
        return;
      }
      const rating = await this.carService.incrementCompletedRentals(req.params.id);
      res.json({ success: true, data: rating });
    } catch (error) {
      next(error);
    }
  };

  applyPublishedReviewAggregate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const serviceKey = req.headers['x-service-key'] as string;
      const { overallScore, categories } = req.body || {};
      if (!isValidServiceKey(serviceKey)) {
        res.status(403).json({ success: false, error: { message: 'Forbidden' } });
        return;
      }
      if (typeof overallScore !== 'number' || !categories || typeof categories !== 'object') {
        res.status(400).json({
          success: false,
          error: { message: 'overallScore and categories are required' },
        });
        return;
      }
      const rating = await this.carService.applyPublishedReviewAggregate(req.params.id, {
        overallScore,
        categories,
      });
      res.json({ success: true, data: rating });
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

      if (!this.canManageCar(req, car.ownerId)) {
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

      if (!this.canManageCar(req, car.ownerId)) {
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

  /** PATCH /api/cars/:id/status — for rental-service (X-Service-Key) or owner */
  updateCarStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const serviceKey = req.headers['x-service-key'] as string;

      if (!status || !ALLOWED_STATUS_UPDATE.includes(status)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid status. Allowed: active, rented, maintenance' },
        });
        return;
      }

      const car = await this.carService.getCarById(id);
      if (!car) {
        res.status(404).json({
          success: false,
          error: { message: 'Car not found' },
        });
        return;
      }

      const isInternalCall = isValidServiceKey(serviceKey);
      const isOwner = req.userId && this.canManageCar(req, car.ownerId);
      if (!isInternalCall && !isOwner) {
        res.status(403).json({
          success: false,
          error: { message: 'Forbidden' },
        });
        return;
      }

      const updated = await this.carService.updateCar(id, { status });
      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/cars/available — лише активні авто (доступні для каталогу) */
  getAvailableCars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await validateDto(SearchCarsDto, req.query);
      const result = await this.carService.getAllCars({
        ...searchDtoToFindAllFilters(dto),
        status: CarStatus.ACTIVE,
      });
      const meta = resolvePageMeta(dto, result.total);
      res.json({
        success: true,
        data: result.items,
        count: result.items.length,
        total: result.total,
        page: meta.page,
        limit: meta.limit,
        totalPages: meta.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/cars/type/:category — фільтр за категорією (business → comfort) */
  getCarsByCategoryParam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mapped = this.mapLegacyCategory(req.params.category || '');
      if (!mapped) {
        res.status(400).json({
          success: false,
          error: { message: 'Unknown category' },
        });
        return;
      }
      const dto = await validateDto(SearchCarsDto, req.query);
      const result = await this.carService.getAllCars({
        ...searchDtoToFindAllFilters(dto),
        category: mapped,
      });
      const meta = resolvePageMeta(dto, result.total);
      res.json({
        success: true,
        data: result.items,
        count: result.items.length,
        total: result.total,
        page: meta.page,
        limit: meta.limit,
        totalPages: meta.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/cars/my — авто поточного власника (JWT) */
  getMyCars = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.userId;
      if (!ownerId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
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

  private mapLegacyCategory(param: string): CarCategory | null {
    const p = param.trim().toLowerCase();
    const map: Record<string, CarCategory> = {
      economy: CarCategory.ECONOMY,
      business: CarCategory.COMFORT,
      comfort: CarCategory.COMFORT,
      premium: CarCategory.PREMIUM,
      suv: CarCategory.SUV,
      luxury: CarCategory.LUXURY,
    };
    return map[p] ?? null;
  }

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
      const result = await this.carService.getAllCars(searchDtoToFindAllFilters(searchParams));
      const meta = resolvePageMeta(searchParams, result.total);

      res.json({
        success: true,
        data: result.items,
        count: result.items.length,
        total: result.total,
        page: meta.page,
        limit: meta.limit,
        totalPages: meta.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };
}
