import { z } from 'zod';

export const monthlySchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(1970),
  }),
});

export const yearlySchema = z.object({
  query: z.object({ year: z.coerce.number().int().min(1970) }),
});

export const trendSchema = z.object({
  query: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
});

export const exportSchema = z.object({
  query: z.object({
    type: z.enum(['pdf', 'csv']),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(1970),
  }),
});
