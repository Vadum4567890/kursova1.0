import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const PORT = Number(process.env.PORT) || 3006;
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\//.test(file.mimetype);
    cb(null, ok);
  },
});

export const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(morgan('combined'));

function fileUrl(filename: string): { url: string; fullUrl: string } {
  const url = `/api/upload/files/${encodeURIComponent(filename)}`;
  return { url, fullUrl: `${PUBLIC_BASE}${url}` };
}

function buildPayload(file: Express.Multer.File) {
  const { url, fullUrl } = fileUrl(file.filename);
  return {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    url,
    fullUrl,
  };
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'media-service', ts: new Date().toISOString() });
});

app.post('/api/upload/image', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: 'Файл image обовʼязковий', data: null });
    return;
  }
  res.json({ message: 'OK', data: buildPayload(req.file) });
});

app.post('/api/upload/images', upload.array('images', 20), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    res.status(400).json({ message: 'Додайте файли images[]', data: [] });
    return;
  }
  res.json({ message: 'OK', data: files.map((f) => buildPayload(f)) });
});

app.get('/api/upload/files/:filename', (req: Request, res: Response) => {
  const safe = path.basename(req.params.filename);
  const full = path.join(UPLOAD_ROOT, safe);
  if (!full.startsWith(UPLOAD_ROOT) || !fs.existsSync(full)) {
    res.status(404).end();
    return;
  }
  res.sendFile(full);
});

app.delete('/api/upload/image/:filename', (req: Request, res: Response) => {
  const safe = path.basename(req.params.filename);
  const full = path.join(UPLOAD_ROOT, safe);
  if (!full.startsWith(UPLOAD_ROOT)) {
    res.status(400).end();
    return;
  }
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    /* ignore */
  }
  res.status(204).end();
});

if (require.main === module) {
  // eslint-disable-next-line no-console
  app.listen(PORT, () => console.log(`media-service on http://localhost:${PORT} (uploads: ${UPLOAD_ROOT})`));
}
