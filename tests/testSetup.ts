import { jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://expense_admin:devmd123@localhost:5432/expense_tracker_test?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET =
  'test_access_secret_long_enough_for_security';
process.env.JWT_REFRESH_SECRET =
  'test_refresh_secret_long_enough_for_security';
process.env.PORT = '5001';

jest.mock('../src/middlewares/rateLimiter.js', () => ({
  apiRateLimiter: (_req: Request, _res: Response, next: NextFunction) =>
    next(),
  authRateLimiter: (_req: Request, _res: Response, next: NextFunction) =>
    next(),
}));

jest.mock('../src/utils/mailer.js', () => ({
  sendMail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined as void),
}));

let prismaAvailable = false;
let redisAvailable = false;
let prisma: typeof import('../src/config/db.js').prisma | undefined;
let redis: typeof import('../src/config/redis.js').redis | undefined;

const isIntegrationTest = () => {
  const testPath = expect.getState().testPath ?? '';
  return testPath.includes('/integration/');
};

beforeAll(async () => {
  if (!isIntegrationTest()) {
    return;
  }

  const db = await import('../src/config/db.js');
  const redisConfig = await import('../src/config/redis.js');
  prisma = db.prisma;
  redis = redisConfig.redis;

  try {
    await prisma.$connect();
    prismaAvailable = true;
  } catch (err) {
    console.error('Failed to connect to Prisma:', err);
  }

  try {
    if (redis.status === 'wait' || redis.status === 'end') {
      await redis.connect();
    }
    redisAvailable = true;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
});

afterAll(async () => {
  if (!isIntegrationTest()) {
    return;
  }

  try {
    await prisma?.$disconnect();
  } catch (err) {
    console.error('Failed to disconnect Prisma:', err);
  }

  try {
    await redis?.quit();
  } catch (err) {
    console.error('Failed to disconnect Redis:', err);
  }
});

beforeEach(async () => {
  if (!isIntegrationTest()) {
    return;
  }

  if (!prismaAvailable && !redisAvailable) {
    return;
  }

  if (prismaAvailable && prisma) {
    try {
      const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename != '_prisma_migrations';
      `;

      for (const { tablename } of tablenames) {
        if (tablename) {
          await prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
          );
        }
      }
    } catch (err) {
      console.error('Failed to truncate tables:', err);
    }
  }

  if (redisAvailable && redis) {
    try {
      await redis.flushdb();
    } catch (err) {
      console.error('Failed to flush Redis:', err);
    }
  }
});
