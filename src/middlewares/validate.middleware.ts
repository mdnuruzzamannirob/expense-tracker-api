import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/response.js';

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      ...(Object.keys(req.body ?? {}).length ? { body: req.body } : {}),
      ...(Object.keys(req.params ?? {}).length ? { params: req.params } : {}),
      ...(Object.keys(req.query ?? {}).length ? { query: req.query } : {}),
    });

    if (!parsed.success) {
      return next(new AppError(400, 'Validation failed'));
    }
    next();
  };
