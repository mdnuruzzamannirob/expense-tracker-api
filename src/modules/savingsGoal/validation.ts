import { z } from 'zod';

export const createSavingsGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    targetAmount: z.number().positive(),
    deadline: z.string().datetime(),
  }),
});

export const contributeSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ amount: z.number().positive() }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().uuid() }) });
