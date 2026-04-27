import { auth, AuthRequest } from './auth';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('rental-service auth middleware', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
    process.env.ALLOW_INSECURE_JWT_DECODE = 'true';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects requests without bearer token', () => {
    const req = { headers: {} } as AuthRequest;
    const res = createResponse();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('normalizes legacy numeric ids into stable UUIDs', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: '42', email: 'legacy@example.com' })).toString('base64url');
    const req = {
      headers: {
        authorization: `Bearer ${header}.${payload}.signature`,
      },
    } as unknown as AuthRequest;
    const res = createResponse();
    const next = jest.fn();

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(req.user?.email).toBe('legacy@example.com');
  });
});
