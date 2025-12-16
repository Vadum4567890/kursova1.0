import * as XLSX from 'xlsx';
import { Rental } from '../models/Rental.entity';
import { RentalStatus } from '../models/Rental.entity';

/**
 * Interface for import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  skipped: number; // Duplicates skipped
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  imported: Rental[];
  skippedItems: Array<{
    row: number;
    data: any;
    reason: string;
  }>;
}

/**
 * Interface for parsed rental data from import
 */
export interface ParsedRentalData {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  startDate: Date;
  expectedEndDate: Date;
  status?: RentalStatus;
}

/**
 * Service for exporting and importing rentals to/from Excel and CSV formats
 */
export class ExportService {
  /**
   * Export rentals to Excel format
   */
  exportToExcel(rentals: Rental[]): Buffer {
    const worksheetData = this.prepareRentalData(rentals);
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Прокати');
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true 
    });
    
    return excelBuffer;
  }

  /**
   * Export rentals to CSV format
   */
  exportToCSV(rentals: Rental[]): string {
    const worksheetData = this.prepareRentalData(rentals);
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return csv;
  }

  /**
   * Generate template file for import (empty file with headers only)
   */
  generateTemplate(format: 'excel' | 'csv'): Buffer | string {
    // Create template data with only headers and example row
    const templateData = [
      {
        'Клієнт': 'Іван Петренко',
        'Телефон': '+380501234567',
        'Email': 'ivan@example.com',
        'Автомобіль': 'Toyota Corolla (2020)',
        'Дата початку': '15.01.2025',
        'Очікувана дата завершення': '20.01.2025',
        'Статус': 'Активний',
      },
    ];

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Прокати');
      
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        cellStyles: true 
      });
      
      return excelBuffer;
    } else {
      // CSV format
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return csv;
    }
  }

  /**
   * Prepare rental data for export
   */
  private prepareRentalData(rentals: Rental[]): any[] {
    return rentals.map((rental) => {
      const startDate = new Date(rental.startDate);
      const expectedEndDate = new Date(rental.expectedEndDate);
      const actualEndDate = rental.actualEndDate ? new Date(rental.actualEndDate) : null;
      const createdAt = new Date(rental.createdAt);

      // Smart detection: if phone contains @, it's actually an email
      // This handles cases where email was stored in phone field (backward compatibility)
      const clientPhone = rental.client?.phone || '';
      const clientEmail = rental.client?.email || '';
      const isPhoneAnEmail = clientPhone.includes('@');
      
      // Determine actual phone and email
      // Priority: use email field if exists, otherwise check if phone is email
      let actualPhone = 'Невідомо';
      let actualEmail = 'Невідомо';
      
      if (clientEmail) {
        // Email field is filled - use it
        actualEmail = clientEmail;
        // Phone is real phone (not email)
        actualPhone = clientPhone || 'Невідомо';
      } else if (isPhoneAnEmail) {
        // Email is stored in phone field (backward compatibility)
        actualEmail = clientPhone;
        actualPhone = 'Невідомо';
      } else {
        // Normal case: phone is phone, no email
        actualPhone = clientPhone || 'Невідомо';
        actualEmail = 'Невідомо';
      }

      return {
        'ID': rental.id,
        'Клієнт': rental.client?.fullName || 'Невідомо',
        'Телефон': actualPhone,
        'Email': actualEmail,
        'Автомобіль': rental.car ? `${rental.car.brand} ${rental.car.model} (${rental.car.year})` : 'Невідомо',
        'Дата початку': this.formatDate(startDate),
        'Очікувана дата завершення': this.formatDate(expectedEndDate),
        'Фактична дата завершення': actualEndDate ? this.formatDate(actualEndDate) : 'Не завершено',
        'Статус': this.getStatusLabel(rental.status),
        'Дні прокату': this.calculateDays(startDate, actualEndDate || expectedEndDate),
        'Вартість прокату': parseFloat(rental.totalCost.toString()).toFixed(2),
        'Депозит': parseFloat(rental.depositAmount.toString()).toFixed(2),
        'Штраф': parseFloat(rental.penaltyAmount.toString()).toFixed(2),
        'Загальна сума': (parseFloat(rental.totalCost.toString()) + parseFloat(rental.penaltyAmount.toString())).toFixed(2),
        'Дата створення': this.formatDate(createdAt),
      };
    });
  }

  /**
   * Format date to Ukrainian format
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  /**
   * Get status label in Ukrainian
   */
  private getStatusLabel(status: RentalStatus): string {
    const labels: Record<RentalStatus, string> = {
      [RentalStatus.ACTIVE]: 'Активний',
      [RentalStatus.COMPLETED]: 'Завершено',
      [RentalStatus.CANCELLED]: 'Скасовано',
    };
    return labels[status] || status;
  }

  /**
   * Calculate rental days
   */
  private calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }

  /**
   * Import rentals from Excel or CSV file
   */
  async importFromFile(fileBuffer: Buffer, filename: string): Promise<ParsedRentalData[]> {
    let workbook: XLSX.WorkBook;
    
    // Determine file type and parse
    if (filename.endsWith('.csv')) {
      // Handle CSV with proper encoding and BOM removal
      let csvData = fileBuffer.toString('utf-8');
      
      // Remove BOM if present (UTF-8 BOM: \ufeff)
      if (csvData.charCodeAt(0) === 0xFEFF) {
        csvData = csvData.slice(1);
      }
      
      // Parse CSV with explicit options
      workbook = XLSX.read(csvData, { 
        type: 'string',
        codepage: 65001, // UTF-8
        FS: ',', // Field separator
        sheetStubs: false,
      });
    } else {
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    }

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Файл не містить жодного листа');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('Не вдалося прочитати дані з файлу');
    }
    
    // Convert to JSON with header row
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, // Get values as strings for proper date parsing
      defval: null, // Default value for empty cells
      blankrows: false, // Skip blank rows
    });
    
    // Debug: log first row to see what columns are detected
    if (data.length > 0 && data[0]) {
      const firstRow = data[0] as any;
      console.log('First row keys:', Object.keys(firstRow));
      console.log('First row sample:', firstRow);
    }

    // Parse and validate data
    const parsedData: ParsedRentalData[] = [];
    const parseErrors: Array<{ row: number; error: string }> = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // +2 because: 1 for header, 1 for 0-based index
      
      try {
        // Helper function to find column value by multiple possible names
        const findColumn = (possibleNames: string[]): string | null => {
          for (const name of possibleNames) {
            if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
              return String(row[name]);
            }
          }
          // Try case-insensitive search
          const rowKeys = Object.keys(row);
          for (const name of possibleNames) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === name.toLowerCase());
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
              return String(row[foundKey]);
            }
          }
          return null;
        };
        
        // Map columns (flexible - support both Ukrainian and English headers)
        const clientName = findColumn(['Клієнт', 'Client', 'Клиент', 'clientName', 'клієнт', 'client']);
        const clientPhone = findColumn(['Телефон', 'Phone', 'телефон', 'phone', 'clientPhone']);
        const clientEmail = findColumn(['Email', 'email', 'clientEmail']);
        const carInfo = findColumn(['Автомобіль', 'Car', 'Автомобиль', 'автомобіль', 'car']);
        const startDateStr = findColumn(['Дата початку', 'Start Date', 'startDate', 'дата початку', 'start date']);
        const expectedEndDateStr = findColumn(['Очікувана дата завершення', 'Expected End Date', 'expectedEndDate', 'очікувана дата завершення', 'expected end date']);
        const statusStr = findColumn(['Статус', 'Status', 'статус', 'status']);

        // Validate required fields
        if (!clientName) {
          throw new Error('Клієнт не вказано');
        }
        if (!carInfo) {
          throw new Error('Автомобіль не вказано');
        }
        if (!startDateStr) {
          throw new Error('Дата початку не вказано');
        }
        if (!expectedEndDateStr) {
          throw new Error('Очікувана дата завершення не вказано');
        }

        // Parse car info (format: "Brand Model (Year)" or "Brand Model Year")
        const carMatch = carInfo.match(/(.+?)\s+(.+?)\s+\((\d+)\)/) || carInfo.match(/(.+?)\s+(.+?)\s+(\d+)/);
        if (!carMatch) {
          throw new Error(`Невірний формат автомобіля: ${carInfo}. Очікується: "Brand Model (Year)"`);
        }
        const [, brand, model, yearStr] = carMatch;
        // Trim whitespace from brand and model to avoid matching issues
        const trimmedBrand = brand.trim();
        const trimmedModel = model.trim();
        const year = parseInt(yearStr);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          throw new Error(`Невірний рік автомобіля: ${yearStr}`);
        }

        // Parse dates (support multiple formats)
        const startDate = this.parseDate(startDateStr);
        const expectedEndDate = this.parseDate(expectedEndDateStr);

        if (!startDate) {
          throw new Error(`Невірний формат дати початку: ${startDateStr}`);
        }
        if (!expectedEndDate) {
          throw new Error(`Невірний формат очікуваної дати завершення: ${expectedEndDateStr}`);
        }

        // Normalize dates to start of day for validation
        startDate.setHours(0, 0, 0, 0);
        expectedEndDate.setHours(0, 0, 0, 0);
        
        // Check if start date is in the past
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        if (startDate < now) {
          throw new Error('Дата початку не може бути в минулому');
        }
        
        if (startDate >= expectedEndDate) {
          throw new Error('Дата початку має бути раніше дати завершення');
        }

        // Parse status (optional)
        let status: RentalStatus | undefined;
        if (statusStr) {
          const statusLower = statusStr.toLowerCase();
          if (statusLower.includes('актив') || statusLower.includes('active')) {
            status = RentalStatus.ACTIVE;
          } else if (statusLower.includes('заверш') || statusLower.includes('completed')) {
            status = RentalStatus.COMPLETED;
          } else if (statusLower.includes('скас') || statusLower.includes('cancelled')) {
            status = RentalStatus.CANCELLED;
          }
        }

        parsedData.push({
          clientName: clientName.trim(),
          clientPhone: clientPhone?.trim(),
          clientEmail: clientEmail?.trim(),
          carBrand: trimmedBrand,
          carModel: trimmedModel,
          carYear: year,
          startDate,
          expectedEndDate,
          status: status || RentalStatus.ACTIVE,
        });
      } catch (error: any) {
        // Collect errors but continue processing other rows
        parseErrors.push({
          row: rowNumber,
          error: error.message || 'Невідома помилка',
        });
        // Continue processing other rows
      }
    }

    // If all rows had errors, throw an error
    if (parsedData.length === 0 && parseErrors.length > 0) {
      const errorMessages = parseErrors.map(e => `Рядок ${e.row}: ${e.error}`).join('; ');
      throw new Error(`Не знайдено жодного валідного рядка для імпорту. Помилки: ${errorMessages}`);
    }

    // If there are parse errors but also valid data, we'll return valid data
    // Errors will be handled by RentalService
    return parsedData;
  }

  /**
   * Parse date from string (support multiple formats)
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try parsing as ISO date
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing Ukrainian format: DD.MM.YYYY or DD.MM.YYYY HH:mm
    const ukrainianFormat = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
    if (ukrainianFormat) {
      const [, day, month, year, hours = '0', minutes = '0'] = ukrainianFormat;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try parsing US format: MM/DD/YYYY
    const usFormat = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usFormat) {
      const [, month, day, year] = usFormat;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }
}

