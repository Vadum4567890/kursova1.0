import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';

export const validateDto = async <T extends object>(
  dtoClass: new () => T,
  data: any
): Promise<T> => {
  const dto = plainToInstance(dtoClass, data, { enableImplicitConversion: true });
  const errors: ValidationError[] = await validate(dto as object);

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      return Object.values(error.constraints || {}).join(', ');
    });

    throw new Error(`Validation failed: ${errorMessages.join('; ')}`);
  }

  return dto;
};

export const validateMiddleware = <T extends object>(
  dtoClass: new () => T
): RequestHandler => {
  return async (req, res, next) => {
    try {
      const dto = await validateDto(dtoClass, req.body);
      req.body = dto;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      });
    }
  };
};

