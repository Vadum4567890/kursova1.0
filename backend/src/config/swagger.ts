import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Car Rental API',
      version: '1.0.0',
      description: 'API documentation for Car Rental System',
      contact: {
        name: 'API Support',
        email: 'support@carrental.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Car: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            brand: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            type: { type: 'string', enum: ['economy', 'business', 'premium'] },
            pricePerDay: { type: 'number' },
            deposit: { type: 'number' },
            status: { type: 'string', enum: ['available', 'rented', 'maintenance'] },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullName: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            registrationDate: { type: 'string', format: 'date-time' },
          },
        },
        Rental: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            clientId: { type: 'integer' },
            carId: { type: 'integer' },
            startDate: { type: 'string', format: 'date-time' },
            expectedEndDate: { type: 'string', format: 'date-time' },
            actualEndDate: { type: 'string', format: 'date-time' },
            depositAmount: { type: 'number' },
            totalCost: { type: 'number' },
            penaltyAmount: { type: 'number' },
            status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
          },
        },
        Penalty: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            rentalId: { type: 'integer' },
            amount: { type: 'number' },
            reason: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

