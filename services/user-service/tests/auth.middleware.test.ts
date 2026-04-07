import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../src/middleware/auth';
import { internalOrAuth } from '../src/middleware/internalOrAuth';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('user-service auth middleware', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('verifies JWT with shared secret when available', async () => {
    process.env.JWT_SECRET = 'user-secret';
    process.env.ALLOW_INSECURE_JWT_DECODE = 'false';
    const token = jwt.sign({ sub: 'user-1', email: 'user@example.com', roles: ['admin'] }, process.env.JWT_SECRET);

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as AuthRequest;
    const res = createResponse();
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.id).toBe('user-1');
    expect(req.user?.roles).toEqual(['admin']);
  });

  it('allows valid internal service key without bearer token', () => {
    process.env.SERVICE_API_KEY = 'service-secret';
    const req = {
      headers: { 'x-service-key': 'service-secret' },
    } as any;
    const res = createResponse();
    const next = jest.fn();

    internalOrAuth(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
