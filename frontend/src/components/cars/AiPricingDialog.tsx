import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { AutoAwesome, Bolt } from '@mui/icons-material';
import { Car } from '../../interfaces';
import { suggestCarPricing } from '../../utils/carPricingAssistant';
import { aiPricingService, AiPriceSuggestion } from '../../services/aiPricingService';

interface AiPricingDialogProps {
  open: boolean;
  formData: Partial<Car>;
  onClose: () => void;
  onApply: (pricePerDay: number, deposit: number) => void;
}

const AiPricingDialog: React.FC<AiPricingDialogProps> = ({ open, formData, onClose, onApply }) => {
  const baseline = useMemo(() => suggestCarPricing(formData), [formData]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiPriceSuggestion | null>(null);
  const [lastSignature, setLastSignature] = useState<string>('');
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(0);

  const current = suggestion ?? baseline;
  const confidenceColor =
    current.confidence === 'high' ? 'success' : current.confidence === 'medium' ? 'warning' : 'default';

  const signature = JSON.stringify({
    brand: formData.brand,
    model: formData.model,
    year: formData.year,
    type: formData.type,
    bodyType: formData.bodyType,
    driveType: formData.driveType,
    transmission: formData.transmission,
    engine: formData.engine,
    fuelType: formData.fuelType,
    seats: formData.seats,
    mileage: formData.mileage,
    features: formData.features,
  });

  const fetchSuggestion = async (force = false) => {
    if (!force && signature === lastSignature && Date.now() - lastFetchedAt < 15_000) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await aiPricingService.getCarPriceSuggestion(formData);
      setSuggestion(data);
      setLastSignature(signature);
      setLastFetchedAt(Date.now());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не вдалося отримати AI-оцінку';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesome color="primary" />
        AI-оцінка ціни та завдатку
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Щоб зекономити бюджет API, прогноз запускається тільки вручну по кнопці. Спочатку
            показано локальний орієнтир.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <Chip
              icon={<Bolt />}
              label={`Ціна/день: ${current.pricePerDay.toLocaleString('uk-UA')} ₴`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<Bolt />}
              label={`Завдаток: ${current.deposit.toLocaleString('uk-UA')} ₴`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`Точність: ${current.confidence === 'high' ? 'висока' : current.confidence === 'medium' ? 'середня' : 'базова'}`}
              color={confidenceColor}
              variant="outlined"
            />
            {suggestion?.provider && (
              <Chip
                label={suggestion.provider === 'openai' ? 'Джерело: OpenAI' : 'Джерело: fallback-модель'}
                variant="outlined"
              />
            )}
          </Stack>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">AI обчислює рекомендацію...</Typography>
            </Box>
          )}

          {error && <Alert severity="warning">{error}</Alert>}

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Що вплинуло на рекомендацію
            </Typography>
            {(current.reasons ?? []).length > 0 ? (
              (current.reasons ?? []).slice(0, 6).map((reason: string) => (
                <Typography key={reason} variant="body2" color="text.secondary">
                  - {reason}
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Додайте більше деталей (рік, пробіг, тип палива, комплектацію) для точнішого прогнозу.
              </Typography>
            )}
          </Box>

          {(current.warnings ?? []).length > 0 && (
            <Alert severity="info">
              {(current.warnings ?? []).map((w: string) => (
                <Typography key={w} variant="body2">
                  - {w}
                </Typography>
              ))}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => void fetchSuggestion(true)} disabled={loading}>
          Оновити прогноз
        </Button>
        <Button
          variant="contained"
          onClick={() => onApply(current.pricePerDay, current.deposit)}
          disabled={loading}
        >
          Застосувати в форму
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AiPricingDialog;

