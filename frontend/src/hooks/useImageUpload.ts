import { useState, useCallback } from 'react';
import { uploadService } from '../services/uploadService';

interface UseImageUploadOptions {
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  allowedTypes?: string[];
  onError?: (error: string) => void;
}

const DEFAULT_OPTIONS: Required<UseImageUploadOptions> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  onError: () => {},
};

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const validateFile = useCallback((file: File): string | null => {
    if (!opts.allowedTypes.includes(file.type)) {
      return 'Непідтримуваний формат файлу. Дозволені формати: JPEG, PNG, GIF, WebP';
    }
    if (file.size > opts.maxFileSize) {
      return `Розмір файлу не повинен перевищувати ${opts.maxFileSize / (1024 * 1024)}MB`;
    }
    return null;
  }, [opts]);

  const uploadSingleImage = useCallback(async (file: File): Promise<string> => {
    const error = validateFile(file);
    if (error) {
      opts.onError(error);
      throw new Error(error);
    }

    setSelectedFile(file);
    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const response = await uploadService.uploadImage(file);
      return response.url;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Помилка завантаження зображення';
      opts.onError(errorMsg);
      setSelectedFile(null);
      setImagePreview(null);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [validateFile, opts]);

  const uploadMultipleImages = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    // Validate files
    const invalidFiles = files.filter(file => validateFile(file) !== null);
    if (invalidFiles.length > 0) {
      const error = 'Непідтримуваний формат файлу. Дозволені формати: JPEG, PNG, GIF, WebP';
      opts.onError(error);
      throw new Error(error);
    }

    const oversizedFiles = files.filter(file => file.size > opts.maxFileSize);
    if (oversizedFiles.length > 0) {
      const error = `Деякі файли перевищують ${opts.maxFileSize / (1024 * 1024)}MB`;
      opts.onError(error);
      throw new Error(error);
    }

    if (files.length > opts.maxFiles) {
      const error = `Максимум ${opts.maxFiles} файлів одночасно`;
      opts.onError(error);
      throw new Error(error);
    }

    setSelectedFiles(files);
    setUploading(true);

    try {
      const responses = await uploadService.uploadImages(files);
      return responses.map(r => r.url);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Помилка завантаження зображень';
      opts.onError(errorMsg);
      setSelectedFiles([]);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [validateFile, opts]);

  const reset = useCallback(() => {
    setImagePreview(null);
    setSelectedFile(null);
    setSelectedFiles([]);
  }, []);

  return {
    uploading,
    imagePreview,
    selectedFile,
    selectedFiles,
    uploadSingleImage,
    uploadMultipleImages,
    reset,
  };
}

