import request from 'supertest';

describe('api-gateway', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reports health with dev auth disabled', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEV_AUTH = 'false';

    const { app } = require('../src/index');
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('api-gateway');
    expect(response.body.devAuthEnabled).toBe(false);
  });

  it('rejects auth routes when dev auth is disabled', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEV_AUTH = 'false';

    const { app } = require('../src/index');
    const response = await request(app).post('/api/auth/login').send({
      usernameOrEmail: 'admin',
      password: 'admin123',
    });

    expect(response.status).toBe(501);
    expect(response.body.error.message).toContain('Dev auth is disabled');
  });

  it('allows login with built-in dev users when dev auth is enabled', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEV_AUTH = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const { app } = require('../src/index');
    const response = await request(app).post('/api/auth/login').send({
      usernameOrEmail: 'admin',
      password: 'admin123',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.username).toBe('admin');
    expect(typeof response.body.data.token).toBe('string');
  });

  it('searches clients through user-service instead of search-service', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEV_AUTH = 'false';
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify([
          { id: 'u-1', fullName: 'Alice Example', phone: '123', email: 'alice@example.com' },
          { id: 'u-2', fullName: 'Bob Test', phone: '999', email: 'bob@example.com' },
        ]),
    } as any);

    const { app } = require('../src/index');
    const response = await request(app).get('/api/search/clients?q=alice');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].fullName).toBe('Alice Example');
  });

  it('returns 502 on rental search upstream failures', async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEV_AUTH = 'false';
    global.fetch = jest.fn().mockRejectedValue(new Error('boom'));

    const { app } = require('../src/index');
    const response = await request(app).post('/api/search/rentals').send({});

    expect(response.status).toBe(502);
    expect(response.body.error.message).toBe('Rental search failed');
  });
});
