import { Request, Response, Router } from 'express';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

type CarPricingInput = {
  brand?: string;
  model?: string;
  year?: number;
  type?: string;
  bodyType?: string;
  driveType?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  seats?: number;
  mileage?: number;
  color?: string;
  features?: string;
  description?: string;
};

type CarPricingSuggestion = {
  pricePerDay: number;
  deposit: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  warnings: string[];
  provider: 'openai' | 'heuristic';
};

type ReferenceCache<T> = { expiresAt: number; data: T };
const refMakesCache: ReferenceCache<string[]> = { expiresAt: 0, data: [] };
const refModelsCache = new Map<string, ReferenceCache<string[]>>();
const REF_TTL_MS = 1000 * 60 * 60 * 24;

function heuristicCarPricing(input: CarPricingInput): Omit<CarPricingSuggestion, 'provider'> {
  const baseByType: Record<string, number> = {
    economy: 1200,
    business: 1800,
    premium: 2500,
    suv: 2700,
    luxury: 3600,
  };
  const type = String(input.type || 'economy').toLowerCase();
  const brand = String(input.brand || '').toLowerCase().trim();
  const model = String(input.model || '').toLowerCase().trim();
  let score = baseByType[type] ?? 1200;
  const reasons: string[] = [`База за клас авто: ${Math.round(score)} грн`];
  const warnings: string[] = [];

  const nowYear = new Date().getFullYear();
  const year = Number.isFinite(input.year) ? Number(input.year) : nowYear;
  if (year > nowYear) {
    const futureBoost = Math.min(500, (year - nowYear) * 220);
    score += futureBoost;
    reasons.push(`Новіший рік (${year}): +${futureBoost} грн`);
  }
  const age = Math.max(0, Math.min(25, nowYear - year));
  score -= age * 70;
  reasons.push(`Вік авто (${age} р.): ${-(age * 70)} грн`);

  const mileage = Number(input.mileage ?? 0);
  if (mileage > 0) {
    const penalty = Math.min(700, Math.floor(mileage / 25000) * 90);
    score -= penalty;
    reasons.push(`Пробіг ${mileage.toLocaleString('uk-UA')} км: -${penalty} грн`);
  } else {
    warnings.push('Пробіг не вказано, оцінка менш точна.');
  }

  const transmission = String(input.transmission || '').toLowerCase();
  if (transmission === 'automatic' || transmission === 'cvt') {
    score += 170;
    reasons.push('Автомат/СVT: +170 грн');
  }

  const drive = String(input.driveType || '').toLowerCase();
  if (drive === 'all-wheel') {
    score += 190;
    reasons.push('Повний привід: +190 грн');
  }

  const bodyType = String(input.bodyType || '').toLowerCase();
  if (bodyType === 'suv' || bodyType === 'wagon') {
    score += 220;
    reasons.push('Популярний кузов для прокату: +220 грн');
  }

  const fuel = String(input.fuelType || '').toLowerCase();
  if (fuel === 'electric') score += 260;
  if (fuel === 'hybrid') score += 170;
  if (fuel === 'diesel') score += 80;

  const premiumBrands = ['bmw', 'mercedes', 'audi', 'lexus', 'porsche', 'land rover', 'tesla'];
  if (premiumBrands.some((b) => brand.includes(b))) {
    score += 900;
    reasons.push('Преміальний бренд: +900 грн');
  }

  if (
    (brand.includes('bmw') && (model.includes('x5') || model.includes('x6') || model.includes('x7'))) ||
    (brand.includes('audi') && model.includes('q7')) ||
    (brand.includes('mercedes') && (model.includes('gle') || model.includes('gls')))
  ) {
    score += 850;
    reasons.push('Топова модель сегменту SUV/Premium: +850 грн');
  }

  const engineRaw = String(input.engine || '').replace(',', '.');
  const engineMatch = engineRaw.match(/(\d+(\.\d+)?)/);
  const engineSize = engineMatch ? Number(engineMatch[1]) : 0;
  if (engineSize >= 3) {
    score += 240;
    reasons.push(`Потужний двигун ${engineSize}л: +240 грн`);
  } else if (engineSize > 0 && engineSize <= 1.4) {
    score -= 120;
    reasons.push(`Малий двигун ${engineSize}л: -120 грн`);
  }

  const featuresCount = String(input.features || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean).length;
  if (featuresCount > 0) {
    const bonus = Math.min(250, featuresCount * 28);
    score += bonus;
    reasons.push(`Оснащення (${featuresCount}): +${bonus} грн`);
  }

  if (!input.brand || !input.model) warnings.push('Вкажіть марку та модель для точнішого прогнозу.');

  if ((type === 'premium' || type === 'suv' || type === 'luxury') && premiumBrands.some((b) => brand.includes(b))) {
    score = Math.max(score, 4200);
  }

  const pricePerDay = Math.max(500, Math.min(18000, Math.round(score / 50) * 50));
  const depositBase = type === 'luxury' ? 3.2 : type === 'premium' || type === 'suv' ? 2.8 : 2.5;
  const deposit = Math.max(1200, Math.min(60000, Math.round((pricePerDay * depositBase) / 50) * 50));
  const confidence: CarPricingSuggestion['confidence'] =
    warnings.length === 0 ? 'high' : warnings.length <= 2 ? 'medium' : 'low';

  return { pricePerDay, deposit, confidence, reasons: reasons.slice(0, 7), warnings };
}

const FALLBACK_MAKES = [
  'Acura', 'Alfa Romeo', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'Buick', 'BYD', 'Cadillac', 'Changan',
  'Chery', 'Chevrolet', 'Chrysler', 'Citroen', 'Cupra', 'Dacia', 'Daewoo', 'Daihatsu', 'Dodge', 'Ferrari',
  'Fiat', 'Ford', 'Geely', 'Genesis', 'GMC', 'Great Wall', 'Honda', 'Hummer', 'Hyundai', 'Infiniti',
  'Isuzu', 'Jaguar', 'Jeep', 'Kia', 'Koenigsegg', 'Lada', 'Lamborghini', 'Lancia', 'Land Rover', 'Lexus',
  'Lincoln', 'Lotus', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi', 'Nissan',
  'Opel', 'Peugeot', 'Polestar', 'Pontiac', 'Porsche', 'Ram', 'Renault', 'Rolls-Royce', 'Saab', 'Seat',
  'Skoda', 'Smart', 'SsangYong', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'ZAZ',
];

async function fetchReferenceMakes(): Promise<string[]> {
  const now = Date.now();
  if (refMakesCache.expiresAt > now && refMakesCache.data.length > 0) return refMakesCache.data;
  try {
    const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json', {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`vpic status ${response.status}`);
    const json = (await response.json()) as { Results?: Array<{ Make_Name?: string }> };
    const rows = (json.Results ?? [])
      .map((r) => String(r.Make_Name || '').trim())
      .filter(Boolean);
    const unique = [...new Set(rows)].sort((a, b) => a.localeCompare(b));
    if (unique.length > 0) {
      refMakesCache.data = unique;
      refMakesCache.expiresAt = now + REF_TTL_MS;
      return unique;
    }
  } catch {
    // fallback below
  }
  return FALLBACK_MAKES;
}

async function fetchReferenceModels(makeRaw: string): Promise<string[]> {
  const make = makeRaw.trim().toLowerCase();
  if (!make) return [];
  const now = Date.now();
  const cached = refModelsCache.get(make);
  if (cached && cached.expiresAt > now) return cached.data;
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(makeRaw)}?format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) throw new Error(`vpic status ${response.status}`);
    const json = (await response.json()) as { Results?: Array<{ Model_Name?: string }> };
    const rows = (json.Results ?? [])
      .map((r) => String(r.Model_Name || '').trim())
      .filter(Boolean);
    const unique = [...new Set(rows)].sort((a, b) => a.localeCompare(b));
    refModelsCache.set(make, { data: unique, expiresAt: now + REF_TTL_MS });
    return unique;
  } catch {
    return [];
  }
}

async function openAiCarPricing(
  input: CarPricingInput
): Promise<{ data: Omit<CarPricingSuggestion, 'provider'> | null; reason?: string }> {
  if (!OPENAI_API_KEY) return { data: null, reason: 'OPENAI_API_KEY не задано' };
  const prompt = `
Ти авто-аналітик ринку оренди в Україні. Оціни рекомендовану ціну за день та завдаток.
Поверни ЛИШЕ JSON формату:
{"pricePerDay":number,"deposit":number,"confidence":"low|medium|high","reasons":["..."],"warnings":["..."]}

Дані авто:
${JSON.stringify(input)}
`;
  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: { format: { type: 'json_object' } },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) {
    let reason = `OpenAI status ${resp.status}`;
    try {
      const errBody = (await resp.json()) as { error?: { message?: string; code?: string } };
      if (errBody?.error?.code || errBody?.error?.message) {
        reason = [errBody.error.code, errBody.error.message].filter(Boolean).join(': ');
      }
    } catch {
      // ignore
    }
    return { data: null, reason };
  }
  const json = (await resp.json()) as any;
  const raw =
    typeof json?.output_text === 'string'
      ? json.output_text
      : typeof json?.output?.[0]?.content?.[0]?.text === 'string'
        ? json.output[0].content[0].text
        : null;
  if (typeof raw !== 'string') return { data: null, reason: 'Пуста відповідь моделі' };
  const parsed = JSON.parse(raw) as Partial<CarPricingSuggestion>;
  if (typeof parsed.pricePerDay !== 'number' || typeof parsed.deposit !== 'number') {
    return { data: null, reason: 'Некоректний JSON від моделі' };
  }
  const confidence =
    parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low'
      ? parsed.confidence
      : 'medium';
  return {
    data: {
      pricePerDay: Math.round(parsed.pricePerDay),
      deposit: Math.round(parsed.deposit),
      confidence,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String).slice(0, 8) : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String).slice(0, 5) : [],
    },
  };
}

export function createAiRouter(): Router {
  const router = Router();

  router.post('/car-price-suggestion', async (req: Request, res: Response) => {
    const input = (req.body || {}) as CarPricingInput;
    try {
      const ai = await openAiCarPricing(input);
      if (ai.data) {
        res.json({ success: true, data: { ...ai.data, provider: 'openai' } });
        return;
      }
      const fallback = heuristicCarPricing(input);
      res.json({
        success: true,
        data: {
          ...fallback,
          warnings: [...fallback.warnings, ai.reason ? `Fallback: ${ai.reason}` : 'Fallback активовано'],
          provider: 'heuristic',
        },
      });
      return;
    } catch {
      // fallback below
    }

    const fallback = heuristicCarPricing(input);
    res.json({ success: true, data: { ...fallback, provider: 'heuristic' } });
  });

  return router;
}

export function createReferenceRouter(): Router {
  const router = Router();

  router.get('/car-makes', async (_req: Request, res: Response) => {
    const makes = await fetchReferenceMakes();
    res.json({ success: true, data: makes });
  });

  router.get('/car-models', async (req: Request, res: Response) => {
    const make = String(req.query.make || '').trim();
    if (!make) {
      res.status(400).json({ success: false, error: { message: 'Query param make is required' } });
      return;
    }
    const models = await fetchReferenceModels(make);
    res.json({ success: true, data: models });
  });

  return router;
}
