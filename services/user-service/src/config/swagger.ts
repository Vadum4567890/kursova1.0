import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'API documentation for User Service - Car Rental Platform',
      contact: {
        name: 'API Support',
        email: 'support@carrental.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['renter', 'owner', 'both', 'admin'] },
            verifiedStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
            emailVerified: { type: 'boolean' },
            phoneVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            birthDate: { type: 'string', format: 'date', nullable: true },
            address: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            country: { type: 'string', default: 'Ukraine' },
            avatarUrl: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserDocument: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            docType: { type: 'string', enum: ['passport', 'driving_license', 'tax_id', 'other'] },
            docNumber: { type: 'string', nullable: true },
            docImageUrl: { type: 'string', nullable: true },
            verified: { type: 'boolean', default: false },
            verifiedAt: { type: 'string', format: 'date-time', nullable: true },
            verifiedBy: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserRating: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            rating: { type: 'number', format: 'float', minimum: 0, maximum: 5 },
            reviewsCount: { type: 'integer' },
            asRenterRating: { type: 'number', format: 'float' },
            asRenterCount: { type: 'integer' },
            asOwnerRating: { type: 'number', format: 'float' },
            asOwnerCount: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

