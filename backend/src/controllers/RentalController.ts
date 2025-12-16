import { Request, Response } from 'express';
import { IRentalService } from '../core/interfaces/IRentalService';
import { IUserRepository } from '../core/interfaces/IUserRepository';
import { CreateRentalDto, CompleteRentalDto, CancelRentalDto, CreateBookingDto } from '../dto/requests/RentalRequest.dto';
import { RentalMapper } from '../dto/mappers/RentalMapper';
import { ExportService } from '../services/ExportService';
import { uploadRentalFile } from '../middleware/uploadFile';
import { Rental } from '../models/Rental.entity';

/**
 * Controller for rental-related endpoints
 * Uses Dependency Injection for services
 */
export class RentalController {
  private exportService: ExportService;

  constructor(
    private rentalService: IRentalService,
    private userRepository: IUserRepository
  ) {
    this.exportService = new ExportService();
  }

  /**
   * GET /api/rentals - Get all rentals
   */
  getAllRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentals = await this.rentalService.getAllRentals();
      const rentalsDto = RentalMapper.toResponseDtoList(rentals);
      res.json(rentalsDto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/active - Get active rentals
   */
  getActiveRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentals = await this.rentalService.getActiveRentals();
      const rentalsDto = RentalMapper.toResponseDtoList(rentals);
      res.json(rentalsDto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/:id - Get rental by ID
   */
  getRentalById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const rental = await this.rentalService.getRentalById(id);
      
      if (!rental) {
        res.status(404).json({ error: 'Rental not found' });
        return;
      }
      
      const rentalDto = RentalMapper.toResponseDto(rental);
      res.json(rentalDto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/client/:clientId - Get rentals by client ID
   */
  getRentalsByClientId = async (req: Request, res: Response): Promise<void> => {
    try {
      const clientId = parseInt(req.params.clientId);
      const rentals = await this.rentalService.getRentalsByClientId(clientId);
      const rentalsDto = RentalMapper.toResponseDtoList(rentals);
      res.json(rentalsDto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/car/:carId - Get rentals by car ID
   */
  getRentalsByCarId = async (req: Request, res: Response): Promise<void> => {
    try {
      const carId = parseInt(req.params.carId);
      const rentals = await this.rentalService.getRentalsByCarId(carId);
      const rentalsDto = RentalMapper.toResponseDtoList(rentals);
      res.json(rentalsDto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals - Create a new rental
   */
  createRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const createRentalDto: CreateRentalDto = req.body;
      
      if (!createRentalDto.clientId || !createRentalDto.carId || !createRentalDto.startDate || !createRentalDto.expectedEndDate) {
        res.status(400).json({ error: 'Missing required fields: clientId, carId, startDate, expectedEndDate' });
        return;
      }
      
      const rental = await this.rentalService.createRental(
        createRentalDto.clientId,
        createRentalDto.carId,
        createRentalDto.startDate instanceof Date ? createRentalDto.startDate : new Date(createRentalDto.startDate),
        createRentalDto.expectedEndDate instanceof Date ? createRentalDto.expectedEndDate : new Date(createRentalDto.expectedEndDate)
      );
      
      const rentalDto = RentalMapper.toResponseDto(rental);
      res.status(201).json(rentalDto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/:id/complete - Complete a rental
   */
  completeRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const completeRentalDto: CompleteRentalDto = req.body;
      
      const rental = await this.rentalService.completeRental(
        id,
        completeRentalDto.actualEndDate
      );
      
      const rentalDto = RentalMapper.toResponseDto(rental);
      res.json(rentalDto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/my - Get rentals for current user (USER role)
   */
  getMyRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      // Get user full name from database if needed
      const userData = await this.userRepository.findById(user.id);
      
      const rentals = await this.rentalService.getRentalsForUser(
        user.id,
        user.email,
        userData?.fullName
      );
      const rentalsDto = RentalMapper.toResponseDtoList(rentals);
      res.json(rentalsDto);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/book - Create booking for user (USER role)
   */
  createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      const createBookingDto: CreateBookingDto = req.body;
      
      if (!createBookingDto.carId || !createBookingDto.startDate || !createBookingDto.expectedEndDate) {
        res.status(400).json({ error: 'Missing required fields: carId, startDate, expectedEndDate' });
        return;
      }
      
      // Get user full name from database
      const userData = await this.userRepository.findById(user.id);
      
      const rental = await this.rentalService.createBookingForUser(
        user.id,
        user.email,
        userData?.fullName,
        createBookingDto.carId,
        createBookingDto.startDate instanceof Date ? createBookingDto.startDate : new Date(createBookingDto.startDate),
        createBookingDto.expectedEndDate instanceof Date ? createBookingDto.expectedEndDate : new Date(createBookingDto.expectedEndDate)
      );
      
      const rentalDto = RentalMapper.toResponseDto(rental);
      res.status(201).json(rentalDto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/:id/cancel - Cancel a rental
   */
  cancelRental = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      
      // For USER role, check if rental belongs to user
      if (user?.role === 'user') {
        const rental = await this.rentalService.getRentalById(id);
        if (!rental) {
          res.status(404).json({ error: 'Rental not found' });
          return;
        }
        
        // Check if rental.client is loaded
        if (!rental.client || !rental.client.id) {
          res.status(500).json({ error: 'Rental client information is missing' });
          return;
        }
        
        // Get user's client
        const userData = await this.userRepository.findById(user.id);
        const client = await this.rentalService.getOrCreateClientForUser(
          user.id,
          user.email,
          userData?.fullName
        );
        
        if (!client || !client.id) {
          res.status(500).json({ error: 'User client information is missing' });
          return;
        }
        
        if (rental.client.id !== client.id) {
          res.status(403).json({ error: 'You can only cancel your own rentals' });
          return;
        }
      }
      
      const cancelRentalDto: CancelRentalDto = req.body || {};
      // cancellationDate is optional, if not provided, use current date
      const cancellationDate = cancelRentalDto.cancellationDate 
        ? (cancelRentalDto.cancellationDate instanceof Date 
            ? cancelRentalDto.cancellationDate 
            : new Date(cancelRentalDto.cancellationDate))
        : undefined;
      
      const cancelledRental = await this.rentalService.cancelRental(
        id,
        cancellationDate
      );
      const rentalDto = RentalMapper.toResponseDto(cancelledRental);
      res.json(rentalDto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/:id/penalty - Add penalty to rental
   */
  addPenalty = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || !reason) {
        res.status(400).json({ error: 'Missing required fields: amount, reason' });
        return;
      }
      
      const penalty = await this.rentalService.addPenalty(id, amount, reason);
      res.status(201).json(penalty);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/export/excel - Export rentals to Excel
   */
  exportToExcel = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentals = await this.rentalService.getAllRentals();
      const excelBuffer = this.exportService.exportToExcel(rentals);
      
      const filename = `rentals_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/export/csv - Export rentals to CSV
   */
  exportToCSV = async (req: Request, res: Response): Promise<void> => {
    try {
      const rentals = await this.rentalService.getAllRentals();
      const csv = this.exportService.exportToCSV(rentals);
      
      const filename = `rentals_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Encoding', 'utf-8');
      
      // Add BOM for proper UTF-8 encoding in Excel
      res.send('\ufeff' + csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/rentals/import/template - Download import template
   */
  downloadTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const format = (req.query.format as string) || 'excel'; // excel or csv
      
      if (format === 'excel') {
        const templateBuffer = this.exportService.generateTemplate('excel') as Buffer;
        const filename = 'rentals_import_template.xlsx';
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(templateBuffer);
      } else if (format === 'csv') {
        const templateCsv = this.exportService.generateTemplate('csv') as string;
        const filename = 'rentals_import_template.csv';
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Encoding', 'utf-8');
        
        // Add BOM for proper UTF-8 encoding in Excel
        res.send('\ufeff' + templateCsv);
      } else {
        res.status(400).json({ error: 'Invalid format. Use "excel" or "csv"' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /api/rentals/import - Import rentals from Excel/CSV file
   */
  importRentals = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const fileBuffer = req.file.buffer;
      const filename = req.file.originalname;

      // Validate file type
      if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls') && !filename.endsWith('.csv')) {
        res.status(400).json({ error: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are supported' });
        return;
      }

      // Import rentals
      const result = await this.rentalService.importRentalsFromFile(fileBuffer, filename);

      const skippedMessage = result.skipped > 0 ? `, ${result.skipped} пропущено (дублікати)` : '';
      res.status(200).json({
        message: `Імпорт завершено: ${result.success} успішно, ${result.failed} помилок${skippedMessage}`,
        success: result.success,
        failed: result.failed,
        skipped: result.skipped || 0,
        errors: result.errors,
        skippedItems: result.skippedItems || [],
        imported: result.imported.map((r: Rental) => RentalMapper.toResponseDto(r)),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

