import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Configure storage for Excel/CSV files (in-memory for processing)
const storage = multer.memoryStorage();

// File filter - only Excel and CSV
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv (alternative)
  ];
  
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Allowed formats: Excel (.xlsx, .xls) or CSV (.csv). Max size: 10MB', 400));
  }
};

// Configure multer for file uploads (in-memory)
export const uploadFile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Single file upload middleware
export const uploadRentalFile = uploadFile.single('file');

