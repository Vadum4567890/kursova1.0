/**
 * Interface for Car Service
 * Defines contract for car business logic operations
 */
export interface ICarService {
  getAllCars(
    pagination?: { page: number; limit: number; offset: number },
    filters?: { [key: string]: any },
    sort?: { field: string; order: 'ASC' | 'DESC' }
  ): Promise<any>;
  
  getCarById(id: number): Promise<any>;
  
  getAvailableCars(
    pagination?: { page: number; limit: number; offset: number },
    filters?: { [key: string]: any },
    sort?: { field: string; order: 'ASC' | 'DESC' }
  ): Promise<any>;
  
  getCarsByType(
    type: string,
    pagination?: { page: number; limit: number; offset: number }
  ): Promise<any>;
  
  createCar(data: any, carType?: string): Promise<any>;
  
  updateCar(id: number, data: Partial<any>): Promise<any>;
  
  deleteCar(id: number): Promise<boolean>;
  
  updateCarStatus(id: number, status: string): Promise<any>;
  
  isCarAvailable(id: number): Promise<boolean>;
}

