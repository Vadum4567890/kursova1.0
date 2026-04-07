import api from './api';
import { UploadResponse } from '../interfaces';
import { isUpstreamUnavailable } from '../utils/upstreamErrors';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Не вдалося прочитати файл'));
    r.readAsDataURL(file);
  });
}

/** Якщо media-service / gateway upload недоступні — превʼю та форма все одно отримують URL (data:) */
async function localFallbackUpload(file: File): Promise<UploadResponse> {
  const dataUrl = await readFileAsDataUrl(file);
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  return {
    filename: `local-${Date.now()}${ext}`,
    originalName: file.name,
    size: file.size,
    mimetype: file.type || 'image/jpeg',
    url: dataUrl,
    fullUrl: dataUrl,
  };
}

export const uploadService = {
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post<{ message: string; data: UploadResponse }>(
        '/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (err) {
      if (isUpstreamUnavailable(err)) return localFallbackUpload(file);
      throw err;
    }
  },

  async uploadImages(files: File[]): Promise<UploadResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await api.post<{ message: string; data: UploadResponse[] }>(
        '/upload/images',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (err) {
      if (isUpstreamUnavailable(err)) {
        return Promise.all(files.map((f) => localFallbackUpload(f)));
      }
      throw err;
    }
  },

  async deleteImage(filename: string): Promise<void> {
    try {
      await api.delete(`/upload/image/${filename}`);
    } catch (err) {
      if (filename.startsWith('local-') || isUpstreamUnavailable(err)) return;
      throw err;
    }
  },
};
