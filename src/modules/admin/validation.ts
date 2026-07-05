import { z } from 'zod';

export const userStatusSchema = z
  .object({
    params: z.object({ id: z.string().uuid() }).strict(),
    body: z.object({ isActive: z.boolean() }).strict(),
  })
  .passthrough();
