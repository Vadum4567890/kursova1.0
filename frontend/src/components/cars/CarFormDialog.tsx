import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { AutoAwesome, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/uk';
import { Car } from '../../interfaces';
import ImageUpload from '../car/ImageUpload';
import AiPricingDialog from './AiPricingDialog';
import { carReferenceService } from '../../services/carReferenceService';

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

const FORM_STEPS = ['Основні дані', 'Ціна та публікація'];

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
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const year = formData.year || new Date().getFullYear();
  const isInvalidYear = year < 1990 || year > new Date().getFullYear() + 1;
  const isInvalidMileage = (formData.mileage ?? 0) < 0;
  const isInvalidPrice = Number(formData.pricePerDay ?? 0) <= 0;
  const isInvalidDeposit = Number(formData.deposit ?? 0) < 0;

  const unavailableSet = useMemo(
    () => new Set(formData.unavailableDates ?? []),
    [formData.unavailableDates]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveStep(0);
    setLoadingBrands(true);
    void carReferenceService
      .getMakes()
      .then((rows) => setBrandOptions(rows))
      .finally(() => setLoadingBrands(false));
  }, [open]);

  useEffect(() => {
    const make = String(formData.brand || '').trim();
    if (!make) {
      setModelOptions([]);
      return;
    }

    setLoadingModels(true);
    void carReferenceService
      .getModels(make)
      .then((rows) => setModelOptions(rows))
      .finally(() => setLoadingModels(false));
  }, [formData.brand]);

  const canMoveToPricingStep = useMemo(() => {
    return Boolean(
      String(formData.brand || '').trim() &&
        String(formData.model || '').trim() &&
        formData.type &&
        !isInvalidYear
    );
  }, [formData.brand, formData.model, formData.type, isInvalidYear]);

  const canSubmit = useMemo(() => {
    return canMoveToPricingStep && !isInvalidPrice && !isInvalidDeposit && !isInvalidMileage;
  }, [canMoveToPricingStep, isInvalidDeposit, isInvalidMileage, isInvalidPrice]);

  const handlePrimaryAction = () => {
    if (activeStep === 0) {
      setActiveStep(1);
      return;
    }

    void onSubmit();
  };

  const renderBasicStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary">
          Основні дані автомобіля
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Autocomplete
          freeSolo
          options={brandOptions}
          loading={loadingBrands}
          value={formData.brand || ''}
          onInputChange={(_event, value) => onFormDataChange({ brand: value })}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Марка"
              required
              fullWidth
              inputProps={{ ...params.inputProps, maxLength: 32 }}
            />
          )}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Autocomplete
          freeSolo
          options={modelOptions}
          loading={loadingModels}
          value={formData.model || ''}
          onInputChange={(_event, value) => onFormDataChange({ model: value })}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Модель"
              required
              fullWidth
              inputProps={{ ...params.inputProps, maxLength: 32 }}
              helperText={
                formData.brand
                  ? 'Список підтягнуто за обраною маркою'
                  : 'Спочатку вкажіть марку'
              }
            />
          )}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Рік"
          type="number"
          value={formData.year || new Date().getFullYear()}
          onChange={(event) => onFormDataChange({ year: parseInt(event.target.value, 10) })}
          fullWidth
          required
          error={isInvalidYear}
          helperText={isInvalidYear ? 'Вкажіть рік у діапазоні 1990..наступний рік' : undefined}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Тип</InputLabel>
          <Select
            value={formData.type || 'economy'}
            label="Тип"
            onChange={(event) => onFormDataChange({ type: event.target.value as Car['type'] })}
          >
            <MenuItem value="economy">Економ</MenuItem>
            <MenuItem value="business">Бізнес</MenuItem>
            <MenuItem value="premium">Преміум</MenuItem>
            <MenuItem value="suv">Позашляховик</MenuItem>
            <MenuItem value="luxury">Люкс</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Divider />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary">
          Опис та характеристики
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Статус</InputLabel>
          <Select
            value={formData.status || 'available'}
            label="Статус"
            onChange={(event) => onFormDataChange({ status: event.target.value as Car['status'] })}
          >
            <MenuItem value="available">Доступний</MenuItem>
            <MenuItem value="rented">В прокаті</MenuItem>
            <MenuItem value="maintenance">На обслуговуванні</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Опис"
          multiline
          minRows={3}
          value={formData.description || ''}
          onChange={(event) => onFormDataChange({ description: event.target.value })}
          fullWidth
          placeholder="Коротко: стан, комплектація, умови передачі авто"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Тип кузова</InputLabel>
          <Select
            value={formData.bodyType || ''}
            label="Тип кузова"
            onChange={(event) => onFormDataChange({ bodyType: event.target.value || undefined })}
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
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Привід</InputLabel>
          <Select
            value={formData.driveType || ''}
            label="Привід"
            onChange={(event) => onFormDataChange({ driveType: event.target.value || undefined })}
          >
            <MenuItem value="">Не вказано</MenuItem>
            <MenuItem value="front-wheel">Передній привід</MenuItem>
            <MenuItem value="rear-wheel">Задній привід</MenuItem>
            <MenuItem value="all-wheel">Повний привід</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Коробка передач</InputLabel>
          <Select
            value={formData.transmission || ''}
            label="Коробка передач"
            onChange={(event) => onFormDataChange({ transmission: event.target.value || undefined })}
          >
            <MenuItem value="">Не вказано</MenuItem>
            <MenuItem value="manual">Механіка</MenuItem>
            <MenuItem value="automatic">Автомат</MenuItem>
            <MenuItem value="cvt">Варіатор</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Двигун"
          value={formData.engine || ''}
          onChange={(event) => onFormDataChange({ engine: event.target.value || undefined })}
          fullWidth
          placeholder="1.4, 2.0, 3.0"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Тип палива</InputLabel>
          <Select
            value={formData.fuelType || ''}
            label="Тип палива"
            onChange={(event) => onFormDataChange({ fuelType: event.target.value || undefined })}
          >
            <MenuItem value="">Не вказано</MenuItem>
            <MenuItem value="gasoline">Бензин</MenuItem>
            <MenuItem value="diesel">Дизель</MenuItem>
            <MenuItem value="hybrid">Гібрид</MenuItem>
            <MenuItem value="electric">Електро</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Кількість місць"
          type="number"
          value={formData.seats || ''}
          onChange={(event) =>
            onFormDataChange({
              seats: event.target.value ? parseInt(event.target.value, 10) : undefined,
            })
          }
          fullWidth
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Пробіг (км)"
          type="number"
          value={formData.mileage || ''}
          onChange={(event) =>
            onFormDataChange({
              mileage: event.target.value ? parseInt(event.target.value, 10) : undefined,
            })
          }
          fullWidth
          error={isInvalidMileage}
          helperText={isInvalidMileage ? 'Пробіг не може бути відʼємним' : undefined}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Колір"
          value={formData.color || ''}
          onChange={(event) => onFormDataChange({ color: event.target.value || undefined })}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Особливості (через кому)"
          value={formData.features || ''}
          onChange={(event) => onFormDataChange({ features: event.target.value || undefined })}
          fullWidth
          placeholder="Кондиціонер, Навігація, Підігрів сидінь"
          helperText="Введіть особливості через кому"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Режим бронювання</InputLabel>
          <Select
            value={formData.instantBook ? 'instant' : 'manual'}
            label="Режим бронювання"
            onChange={(event) => onFormDataChange({ instantBook: event.target.value === 'instant' })}
          >
            <MenuItem value="manual">Підтвердження орендодавцем (manual approval)</MenuItem>
            <MenuItem value="instant">Миттєве бронювання (instant book)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Недоступні для оренди дні — натисніть дату в календарі, щоб позначити або зняти позначку.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', '& .MuiDateCalendar-root': { maxWidth: '100%' } }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
            <DateCalendar
              value={null}
              disablePast
              onChange={(newValue: Dayjs | null) => {
                if (!newValue) return;
                const key = newValue.format('YYYY-MM-DD');
                const cur = new Set(formData.unavailableDates ?? []);
                if (cur.has(key)) cur.delete(key);
                else cur.add(key);
                onFormDataChange({ unavailableDates: [...cur].sort() });
              }}
              slots={{
                day: (props: PickersDayProps<Dayjs>) => {
                  const key = props.day.format('YYYY-MM-DD');
                  const isSelected = unavailableSet.has(key);
                  return <PickersDay {...props} selected={isSelected} />;
                },
              }}
            />
          </LocalizationProvider>
        </Box>
        {(formData.unavailableDates?.length ?? 0) > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Обрано днів: {formData.unavailableDates?.length}. Дати: {formData.unavailableDates?.join(', ')}
          </Typography>
        )}
      </Grid>
    </Grid>
  );

  const renderPricingStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            overflow: 'hidden',
            background:
              'linear-gradient(135deg, rgba(88,164,255,0.12), rgba(101,84,192,0.14))',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                AI-прогноз ціни
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Перевір рекомендацію від AI, а потім зафіксуй свою ціну за день і
                розмір завдатку.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => setAiDialogOpen(true)}
              >
                Відкрити AI-оцінку
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary">
          Вартість та умови публікації
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Ціна за день (₴)"
          type="number"
          value={formData.pricePerDay || 0}
          onChange={(event) =>
            onFormDataChange({ pricePerDay: parseFloat(event.target.value || '0') })
          }
          fullWidth
          required
          error={isInvalidPrice}
          helperText={isInvalidPrice ? 'Вкажіть ціну більше 0' : 'Сума, яку бачить орендар'}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Завдаток (₴)"
          type="number"
          value={formData.deposit || 0}
          onChange={(event) =>
            onFormDataChange({ deposit: parseFloat(event.target.value || '0') })
          }
          fullWidth
          required
          error={isInvalidDeposit}
          helperText={isInvalidDeposit ? 'Завдаток не може бути відʼємним' : 'Повертається після оренди'}
        />
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Перед публікацією перевір фото, опис і ціну. Саме ці дані найбільше впливають на
          конверсію в бронювання.
        </Alert>
      </Grid>

      <Grid item xs={12}>
        <Divider />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary">
          Фото
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <ImageUpload
          mainImageUrl={mainImageUrl}
          additionalImageUrls={additionalImageUrls}
          onMainImageChange={onMainImageChange}
          onAdditionalImagesChange={onAdditionalImagesChange}
          disabled={uploading}
        />
      </Grid>
    </Grid>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 960,
            overflowX: 'hidden',
          },
        }}
      >
        <DialogTitle>
          {isEditing ? 'Редагувати автомобіль' : 'Додати автомобіль'}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            overflowX: 'hidden',
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              overflowX: 'hidden',
              pt: 1,
            }}
          >
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {FORM_STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 ? renderBasicStep() : renderPricingStep()}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            overflowX: 'hidden',
            flexWrap: 'wrap',
            rowGap: 1,
          }}
        >
          {activeStep === 1 && (
            <Button startIcon={<NavigateBefore />} onClick={() => setActiveStep(0)} disabled={loading}>
              Назад
            </Button>
          )}

          <Button onClick={onClose} disabled={loading}>
            Скасувати
          </Button>

          <Button
            onClick={handlePrimaryAction}
            variant="contained"
            disabled={loading || (activeStep === 0 ? !canMoveToPricingStep : !canSubmit)}
            endIcon={activeStep === 0 ? <NavigateNext /> : undefined}
          >
            {activeStep === 0 ? 'Наступна' : isEditing ? 'Зберегти' : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      <AiPricingDialog
        open={aiDialogOpen}
        formData={formData}
        onClose={() => setAiDialogOpen(false)}
        onApply={(pricePerDay, deposit) => {
          onFormDataChange({ pricePerDay, deposit });
          setAiDialogOpen(false);
        }}
      />
    </>
  );
};

export default CarFormDialog;
