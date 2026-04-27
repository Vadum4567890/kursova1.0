import jwt from 'jsonwebtoken';
import { optionalJwtUser, requireJwtUser } from '../src/middleware/jwtUser';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('car-service jwt middleware', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('requires bearer token for protected routes', () => {
    const req = { headers: {} } as any;
    const res = createResponse();
    const next = jest.fn();

    requireJwtUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts verified JWT and stores string userId', () => {
    process.env.JWT_SECRET = 'car-secret';
    process.env.ALLOW_INSECURE_JWT_DECODE = 'false';
    const token = jwt.sign({ sub: 'owner-123' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const res = createResponse();
    const next = jest.fn();

    optionalJwtUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('owner-123');
  });
});
