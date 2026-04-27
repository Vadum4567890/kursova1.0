import { Car } from '../interfaces';

type ScoreReason = { label: string; delta: number };

export type CarPriceSuggestion = {
  pricePerDay: number;
  deposit: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  warnings: string[];
};

const BASE_PRICE: Record<Car['type'], number> = {
  economy: 1100,
  business: 1700,
  premium: 2300,
  suv: 2500,
  luxury: 3400,
};

const PREMIUM_BRANDS = ['bmw', 'mercedes', 'audi', 'lexus', 'porsche', 'tesla', 'land rover', 'jaguar'];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseEngineLiters(engine?: string): number | null {
  if (!engine) return null;
  const m = engine.replace(',', '.').match(/(\d+(\.\d+)?)/);
  if (!m) return null;
  const v = Number(m[1]);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

function roundTo50(v: number): number {
  return Math.round(v / 50) * 50;
}

function normalizeFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value == null) {
    return [];
  }

  return [String(value).trim()].filter(Boolean);
}

export function suggestCarPricing(form: Partial<Car>): CarPriceSuggestion {
  const reasons: ScoreReason[] = [];
  const warnings: string[] = [];

  const type = form.type ?? 'economy';
  let score = BASE_PRICE[type];
  reasons.push({ label: `Базова ставка для сегменту ${type}`, delta: BASE_PRICE[type] });

  const year = form.year ?? new Date().getFullYear();
  const age = clamp(new Date().getFullYear() - year, 0, 25);
  const ageDelta = -age * 60;
  score += ageDelta;
  reasons.push({ label: `Корекція за вік авто (${age} р.)`, delta: ageDelta });

  const mileage = form.mileage ?? 0;
  if (mileage > 0) {
    const mileagePenalty = -Math.min(500, Math.floor(mileage / 30000) * 80);
    score += mileagePenalty;
    reasons.push({ label: `Корекція за пробіг (${mileage.toLocaleString('uk-UA')} км)`, delta: mileagePenalty });
  }

  const fuel = (form.fuelType || '').toLowerCase();
  if (fuel === 'electric') {
    score += 240;
    reasons.push({ label: 'Електро: вищий попит у місті', delta: 240 });
  } else if (fuel === 'hybrid') {
    score += 160;
    reasons.push({ label: 'Гібрид: економність для орендаря', delta: 160 });
  } else if (fuel === 'diesel') {
    score += 70;
    reasons.push({ label: 'Дизель: стабільний попит для траси', delta: 70 });
  }

  const transmission = (form.transmission || '').toLowerCase();
  if (transmission === 'automatic' || transmission === 'cvt') {
    score += 150;
    reasons.push({ label: 'Автомат/CVT: вища ринкова ставка', delta: 150 });
  }

  const drive = (form.driveType || '').toLowerCase();
  if (drive === 'all-wheel') {
    score += 180;
    reasons.push({ label: 'Повний привід: додаткова цінність', delta: 180 });
  }

  const brand = (form.brand || '').toLowerCase().trim();
  if (brand && PREMIUM_BRANDS.some((b) => brand.includes(b))) {
    score += 260;
    reasons.push({ label: 'Преміальний бренд', delta: 260 });
  }

  const engine = parseEngineLiters(form.engine);
  if (engine && engine >= 3) {
    score += 180;
    reasons.push({ label: `Потужний двигун ${engine}л`, delta: 180 });
  } else if (engine && engine <= 1.2) {
    score -= 80;
    reasons.push({ label: `Малий двигун ${engine}л`, delta: -80 });
  }

  const featuresCount = normalizeFeatures(form.features).length;
  if (featuresCount > 0) {
    const bonus = Math.min(200, featuresCount * 25);
    score += bonus;
    reasons.push({ label: `Оснащення (${featuresCount} опц.)`, delta: bonus });
  }

  const suggestedPrice = roundTo50(clamp(score, 500, 12000));
  const depositMultiplier = type === 'luxury' ? 3.2 : type === 'premium' || type === 'suv' ? 2.8 : 2.4;
  const suggestedDeposit = roundTo50(clamp(suggestedPrice * depositMultiplier, 1000, 45000));

  if (!form.brand || !form.model) {
    warnings.push('Вкажіть марку і модель для точнішої рекомендації.');
  }
  if (!form.year) {
    warnings.push('Вкажіть рік випуску, щоб точніше оцінити ціну.');
  }
  if (!form.mileage && form.mileage !== 0) {
    warnings.push('Пробіг не вказано: оцінка без поправки на зношення.');
  }

  const confidence: CarPriceSuggestion['confidence'] =
    warnings.length === 0 ? 'high' : warnings.length <= 2 ? 'medium' : 'low';

  return {
    pricePerDay: suggestedPrice,
    deposit: suggestedDeposit,
    confidence,
    reasons: reasons
      .filter((r) => r.delta !== 0)
      .slice(0, 6)
      .map((r) => `${r.label}: ${r.delta > 0 ? '+' : ''}${r.delta} грн`),
    warnings,
  };
}

