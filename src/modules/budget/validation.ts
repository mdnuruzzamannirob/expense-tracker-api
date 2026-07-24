import { z } from 'zod';

const budgetFields = z
  .object({
    limit: z.coerce.number().finite().positive().max(9_999_999_999.99),
    alertThreshold: z.coerce.number().int().min(1).max(100).default(80),
    period: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
    month: z.coerce.number().int().min(1).max(12).nullable().optional(),
    year: z.coerce.number().int().min(1970).max(3000),
    categoryId: z.string().uuid().nullable().optional(),
    rollover: z.boolean().default(false),
  })
  .strict();

export const createBudgetSchema = z.object({
  body: budgetFields.superRefine((value, context) => {
    if (value.period === 'MONTHLY' && value.month == null) {
      context.addIssue({
        code: 'custom',
        path: ['month'],
        message: 'Month is required for a monthly budget',
      });
    }
  }),
});

export const listBudgetSchema = z.object({
  query: z
    .object({
      month: z.coerce.number().int().min(1).max(12).optional(),
      year: z.coerce.number().int().min(1970).max(3000).optional(),
      period: z.enum(['MONTHLY', 'YEARLY']).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});

export const updateBudgetSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
  body: budgetFields
    .partial()
    .refine((value) => Object.keys(value).length > 0, 'No changes supplied'),
});

export const budgetIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
});
