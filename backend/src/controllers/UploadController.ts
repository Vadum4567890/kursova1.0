import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import path from 'path';

export class UploadController {
  /**
   * POST /api/upload/image - Upload single image
   */
  uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/images/${req.file.filename}`;
      const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

      res.status(200).json({
        message: 'Image uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl,
          fullUrl: fullUrl
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to upload image', 500);
    }
  };

  /**
   * POST /api/upload/images - Upload multiple images
   */
  uploadImages = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.files) {
        throw new AppError('No files uploaded', 400);
      }

      // Handle array of files from upload.array()
      let files: Express.Multer.File[] = [];
      if (Array.isArray(req.files)) {
        files = req.files;
      } else if (typeof req.files === 'object') {
        // Handle object with field names (upload.fields())
        const fileArrays = Object.values(req.files);
        files = fileArrays.flat();
      }

      if (files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const uploadedFiles = files.map((file) => {
        const fileUrl = `/uploads/images/${file.filename}`;
        const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;
        return {
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          url: fileUrl,
          fullUrl: fullUrl
        };
      });

      res.status(200).json({
        message: 'Images uploaded successfully',
        data: uploadedFiles
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to upload images', 500);
    }
  };

  /**
   * DELETE /api/upload/image/:filename - Delete uploaded image
   */
  deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      const fs = require('fs').promises;
      const imagePath = path.join(__dirname, '../../uploads/images', filename);

      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        
        res.status(200).json({
          message: 'Image deleted successfully'
        });
      } catch (fsError: any) {
        if (fsError.code === 'ENOENT') {
          throw new AppError('Image not found', 404);
        }
        throw fsError;
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to delete image', 500);
    }
  };
}

