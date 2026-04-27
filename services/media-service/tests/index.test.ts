import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';

describe('media-service', () => {
  const originalEnv = { ...process.env };
  let tempDir: string;

  beforeEach(() => {
    jest.resetModules();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-service-test-'));
    process.env = {
      ...originalEnv,
      UPLOAD_DIR: tempDir,
      PUBLIC_BASE_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns health status', async () => {
    const { app } = require('../src/index');
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('media-service');
  });

  it('rejects image upload when file is missing', async () => {
    const { app } = require('../src/index');
    const response = await request(app).post('/api/upload/image');

    expect(response.status).toBe(400);
    expect(response.body.data).toBeNull();
  });

  it('uploads an image and returns file payload', async () => {
    const { app } = require('../src/index');
    const response = await request(app)
      .post('/api/upload/image')
      .attach('image', Buffer.from('fake-image-content'), {
        filename: 'test.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.originalName).toBe('test.png');
    expect(response.body.data.url).toMatch(/^\/api\/upload\/files\//);
    expect(fs.existsSync(path.join(tempDir, response.body.data.filename))).toBe(true);
  });
});
