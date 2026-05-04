import { UserController } from '../src/controllers/UserController';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('user-service client compatibility controller', () => {
  it('lists absorbed clients', async () => {
    const controller = new UserController();
    const listClients = jest.fn().mockResolvedValue([{ id: 'u-1', fullName: 'Alice', phone: '+3801' }]);
    (controller as any).userService = { listClients };
    const res = createResponse();
    const next = jest.fn();

    await controller.listClients({ query: { q: 'Alice' } } as any, res, next);

    expect(listClients).toHaveBeenCalledWith('Alice');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 'u-1', fullName: 'Alice', phone: '+3801' }],
      count: 1,
    });
  });

  it('returns existing client in registerOrGet with 200', async () => {
    const controller = new UserController();
    const client = { id: 'u-1', fullName: 'Alice', phone: '+3801' };
    (controller as any).userService = {
      getClientByPhone: jest.fn().mockResolvedValue(client),
      registerOrGetClient: jest.fn().mockResolvedValue(client),
    };
    const res = createResponse();
    const next = jest.fn();

    await controller.registerOrGetClient({ body: { phone: '+3801' } } as any, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: client });
  });

  it('creates client through absorbed endpoint with 201', async () => {
    const controller = new UserController();
    const client = { id: 'u-2', fullName: 'Bob', phone: '+3802' };
    (controller as any).userService = {
      createClient: jest.fn().mockResolvedValue(client),
    };
    const res = createResponse();
    const next = jest.fn();

    await controller.createClient(
      { body: { fullName: 'Bob', address: 'Kyiv', phone: '+3802' } } as any,
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: client });
  });
});
