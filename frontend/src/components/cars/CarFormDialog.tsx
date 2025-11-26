import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Car } from '../../interfaces';
import { FormDialog } from '../common';
import ImageUpload from '../car/ImageUpload';

interface CarFormDialogProps {
  open: boolean;
  isEditing: boolean;
  formData: Partial<Car>;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (updates: Partial<Car>) => void;
  onMainImageChange: (url: string) => void;
  onAdditionalImagesChange: (urls: string[]) => void;
  mainImageUrl?: string;
  additionalImageUrls?: string[];
  uploading?: boolean;
}

export const CarFormDialog: React.FC<CarFormDialogProps> = ({
  open,
  isEditing,
  formData,
  loading,
  onClose,
  onSubmit,
  onFormDataChange,
  onMainImageChange,
  onAdditionalImagesChange,
  mainImageUrl,
  additionalImageUrls = [],
  uploading = false,
}) => {
  return (
    <FormDialog
      open={open}
      title={isEditing ? 'Редагувати автомобіль' : 'Додати автомобіль'}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
      submitLabel={isEditing ? 'Зберегти' : 'Створити'}
      maxWidth="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Марка"
            value={formData.brand || ''}
            onChange={(e) => onFormDataChange({ brand: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Модель"
            value={formData.model || ''}
            onChange={(e) => onFormDataChange({ model: e.target.value })}
            fullWidth
            required
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Рік"
            type="number"
            value={formData.year || new Date().getFullYear()}
            onChange={(e) => onFormDataChange({ year: parseInt(e.target.value) })}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>Тип</InputLabel>
            <Select
              value={formData.type || 'economy'}
              label="Тип"
              onChange={(e) => onFormDataChange({ type: e.target.value as Car['type'] })}
            >
              <MenuItem value="economy">Економ</MenuItem>
              <MenuItem value="business">Бізнес</MenuItem>
              <MenuItem value="premium">Преміум</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Ціна за день (₴)"
            type="number"
            value={formData.pricePerDay || 0}
            onChange={(e) => onFormDataChange({ pricePerDay: parseFloat(e.target.value) })}
            fullWidth
            required
          />
          <TextField
            label="Залог (₴)"
            type="number"
            value={formData.deposit || 0}
            onChange={(e) => onFormDataChange({ deposit: parseFloat(e.target.value) })}
            fullWidth
            required
          />
        </Box>
        <FormControl fullWidth>
          <InputLabel>Статус</InputLabel>
          <Select
            value={formData.status || 'available'}
            label="Статус"
            onChange={(e) => onFormDataChange({ status: e.target.value as Car['status'] })}
          >
            <MenuItem value="available">Доступний</MenuItem>
            <MenuItem value="rented">В прокаті</MenuItem>
            <MenuItem value="maintenance">На обслуговуванні</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Опис"
          multiline
          rows={3}
          value={formData.description || ''}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Тип кузова</InputLabel>
            <Select
              value={formData.bodyType || ''}
              label="Тип кузова"
              onChange={(e) => onFormDataChange({ bodyType: e.target.value || undefined })}
            >
              <MenuItem value="">Не вказано</MenuItem>
              <MenuItem value="sedan">Седан</MenuItem>
              <MenuItem value="hatchback">Хетчбек</MenuItem>
              <MenuItem value="suv">Позашляховик</MenuItem>
              <MenuItem value="coupe">Купе</MenuItem>
              <MenuItem value="wagon">Універсал</MenuItem>
              <MenuItem value="convertible">Кабріолет</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Привід</InputLabel>
            <Select
              value={formData.driveType || ''}
              label="Привід"
              onChange={(e) => onFormDataChange({ driveType: e.target.value || undefined })}
            >
              <MenuItem value="">Не вказано</MenuItem>
              <MenuItem value="front-wheel">Передній привід</MenuItem>
              <MenuItem value="rear-wheel">Задній привід</MenuItem>
              <MenuItem value="all-wheel">Повний привід</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Коробка передач</InputLabel>
            <Select
              value={formData.transmission || ''}
              label="Коробка передач"
              onChange={(e) => onFormDataChange({ transmission: e.target.value || undefined })}
            >
              <MenuItem value="">Не вказано</MenuItem>
              <MenuItem value="manual">Механіка</MenuItem>
              <MenuItem value="automatic">Автомат</MenuItem>
              <MenuItem value="cvt">Вариатор</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Двигун"
            value={formData.engine || ''}
            onChange={(e) => onFormDataChange({ engine: e.target.value || undefined })}
            fullWidth
            placeholder="1.4, 2.0, etc."
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Тип палива</InputLabel>
            <Select
              value={formData.fuelType || ''}
              label="Тип палива"
              onChange={(e) => onFormDataChange({ fuelType: e.target.value || undefined })}
            >
              <MenuItem value="">Не вказано</MenuItem>
              <MenuItem value="gasoline">Бензин</MenuItem>
              <MenuItem value="diesel">Дизель</MenuItem>
              <MenuItem value="hybrid">Гібрид</MenuItem>
              <MenuItem value="electric">Електричний</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Кількість місць"
            type="number"
            value={formData.seats || ''}
            onChange={(e) => onFormDataChange({ seats: e.target.value ? parseInt(e.target.value) : undefined })}
            fullWidth
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Пробіг (км)"
            type="number"
            value={formData.mileage || ''}
            onChange={(e) => onFormDataChange({ mileage: e.target.value ? parseInt(e.target.value) : undefined })}
            fullWidth
          />
          <TextField
            label="Колір"
            value={formData.color || ''}
            onChange={(e) => onFormDataChange({ color: e.target.value || undefined })}
            fullWidth
          />
        </Box>
        <TextField
          label="Особливості (через кому)"
          value={formData.features || ''}
          onChange={(e) => onFormDataChange({ features: e.target.value || undefined })}
          fullWidth
          placeholder="Кондиціонер, Навігація, Підігрів сидінь"
          helperText="Введіть особливості через кому"
        />
        <ImageUpload
          mainImageUrl={mainImageUrl}
          additionalImageUrls={additionalImageUrls}
          onMainImageChange={onMainImageChange}
          onAdditionalImagesChange={onAdditionalImagesChange}
          disabled={uploading}
        />
      </Box>
    </FormDialog>
  );
};

