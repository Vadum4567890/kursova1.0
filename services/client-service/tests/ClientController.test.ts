jest.mock('../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { ClientController } from '../src/controllers/ClientController';
import { AppDataSource } from '../src/database/data-source';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe('client-service ClientController', () => {
  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(repository);
  });

  it('validates required fields on create', async () => {
    const controller = new ClientController();
    const res = createResponse();

    await controller.create({ body: { fullName: 'Test' } } as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('returns existing client in registerOrGet', async () => {
    const controller = new ClientController();
    const existing = { id: 1, phone: '123456' };
    repository.findOne.mockResolvedValue(existing);
    const res = createResponse();

    await controller.registerOrGet({ body: { phone: '123456' } } as any, res);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { phone: '123456' } });
    expect(res.json).toHaveBeenCalledWith({ data: existing });
  });

  it('creates a new client when registerOrGet does not find one', async () => {
    const controller = new ClientController();
    repository.findOne.mockResolvedValue(null);
    repository.create.mockImplementation((value) => value);
    repository.save.mockImplementation(async (value) => ({ id: 2, ...value }));
    const res = createResponse();

    await controller.registerOrGet(
      {
        body: { fullName: 'Alice', address: 'Kyiv', phone: '123456', email: 'alice@example.com' },
      } as any,
      res
    );

    expect(repository.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: 2, fullName: 'Alice', phone: '123456' }),
    });
  });
});
