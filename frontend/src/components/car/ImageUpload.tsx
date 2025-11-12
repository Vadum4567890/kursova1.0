import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { uploadService } from '../../services/uploadService';

interface ImageUploadProps {
  mainImageUrl?: string;
  additionalImageUrls?: string[];
  onMainImageChange: (url: string) => void;
  onAdditionalImagesChange: (urls: string[]) => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  mainImageUrl,
  additionalImageUrls = [],
  onMainImageChange,
  onAdditionalImagesChange,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Непідтримуваний формат файлу. Дозволені формати: JPEG, PNG, GIF, WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const response = await uploadService.uploadImage(file);
      onMainImageChange(response.url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження зображення');
      setSelectedFile(null);
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError('Непідтримуваний формат файлу. Дозволені формати: JPEG, PNG, GIF, WebP');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Деякі файли перевищують 5MB');
      return;
    }

    if (files.length > 10) {
      setError('Максимум 10 файлів одночасно');
      return;
    }

    setSelectedFiles(files);
    setError('');

    try {
      setUploading(true);
      const responses = await uploadService.uploadImages(files);
      const urls = responses.map(r => r.url);
      onAdditionalImagesChange([...additionalImageUrls, ...urls]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження зображень');
      setSelectedFiles([]);
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    return `${window.location.protocol}//${window.location.hostname}:3000${url}`;
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Підтримувані формати: JPEG, PNG, GIF, WebP (макс. 5MB)
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={uploading || disabled}
            sx={{ mb: 1 }}
            color="primary"
          >
            {uploading ? 'Завантаження...' : 'Вибрати головне фото'}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleMainImageChange}
            />
          </Button>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            disabled={uploading || disabled}
            sx={{ mb: 1 }}
          >
            {uploading ? 'Завантаження...' : 'Додати інші фото'}
            <input
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleMultipleImagesChange}
            />
          </Button>
          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Головне фото:
          </Typography>
          {(imagePreview || mainImageUrl) && (
            <Box
              sx={{
                width: 150,
                height: 150,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                position: 'relative',
              }}
            >
              <img
                src={imagePreview || getImageUrl(mainImageUrl!)}
                alt="Головне фото"
                crossOrigin="anonymous"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'cover',
                }}
                onError={(e: any) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
              />
              <Button
                size="small"
                onClick={() => {
                  onMainImageChange('');
                  setImagePreview(null);
                  setSelectedFile(null);
                }}
                disabled={disabled}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 24,
                  width: 24,
                  height: 24,
                  backgroundColor: 'error.main',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: 0,
                  '&:hover': {
                    backgroundColor: 'error.dark',
                  },
                }}
              >
                ×
              </Button>
            </Box>
          )}
          {!imagePreview && !mainImageUrl && (
            <Box
              sx={{
                width: 150,
                height: 150,
                border: '1px dashed #ddd',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fafafa',
                color: 'text.secondary',
              }}
            >
              <Typography variant="caption" align="center">
                Головне фото
              </Typography>
            </Box>
          )}
          {additionalImageUrls.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Інші фото ({additionalImageUrls.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 300 }}>
                {additionalImageUrls.map((url, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 70,
                      height: 70,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    <img
                      src={getImageUrl(url)}
                      alt={`Image ${index + 1}`}
                      crossOrigin="anonymous"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e: any) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                    <Button
                      size="small"
                      onClick={() => {
                        const newUrls = additionalImageUrls.filter((_, i) => i !== index);
                        onAdditionalImagesChange(newUrls);
                      }}
                      disabled={disabled}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        minWidth: 20,
                        width: 20,
                        height: 20,
                        backgroundColor: 'error.main',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: 0,
                        '&:hover': {
                          backgroundColor: 'error.dark',
                        },
                      }}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ImageUpload;

