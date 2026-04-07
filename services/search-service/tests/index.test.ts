import request from 'supertest';
import axios from 'axios';
import { app, extractArrayPayload, mapCarSearchQuery } from '../src/index';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('search-service helpers', () => {
  it('maps legacy car search filters into car-service query params', () => {
    expect(
      mapCarSearchQuery({
        minPrice: '10',
        maxPrice: '20',
        type: 'business',
        status: 'available',
        brand: 'BMW',
        model: 'X5',
      })
    ).toEqual({
      minPrice: 10,
      maxPrice: 20,
      category: 'comfort',
      status: 'active',
      searchQuery: 'BMW X5',
    });
  });

  it('extracts wrapped data arrays safely', () => {
    expect(extractArrayPayload([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(extractArrayPayload({ data: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(extractArrayPayload({ data: { id: 3 } })).toEqual([]);
  });
});

describe('search-service endpoints', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it('searches clients from wrapped client-service responses', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [
          { fullName: 'Alice Example', phone: '123', email: 'alice@example.com' },
          { fullName: 'Bob Test', phone: '999', email: 'bob@example.com' },
        ],
      },
    } as any);

    const response = await request(app).get('/api/search/clients?q=alice');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].fullName).toBe('Alice Example');
  });

  it('returns upstream failures from rental search as 502', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('boom'));

    const response = await request(app).post('/api/search/rentals').send({});

    expect(response.status).toBe(502);
    expect(response.body.error.message).toBe('Rental search failed');
  });
});
