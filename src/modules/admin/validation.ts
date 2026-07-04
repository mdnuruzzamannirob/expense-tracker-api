import { z } from 'zod';

export const userStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ isActive: z.boolean() }),
});
