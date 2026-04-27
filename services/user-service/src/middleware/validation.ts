import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToInstance(dtoClass, req.body);
      const errors: ValidationError[] = await validate(dto);

      if (errors.length > 0) {
        const errorMessages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        );

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      req.body = dto;
      next();
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data'
      });
    }
  };
};

