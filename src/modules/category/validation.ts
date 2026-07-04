import { z } from 'zod';

const typeSchema = z.enum(['INCOME', 'EXPENSE']);

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: typeSchema,
    icon: z.string().optional(),
    color: z.string().optional(),
  }).strict(),
}).strict();

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createCategorySchema.shape.body.partial(),
}).strict();

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
}).strict();
