import { spawnSync } from 'node:child_process';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const run = (
  args: string[],
  environment: Record<string, string | undefined>,
) => {
  const result = spawnSync(pnpm, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${pnpm} ${args.join(' ')} exited with ${result.status}`);
  }
};

const main = async () => {
  let postgres: StartedTestContainer | undefined;
  let redis: StartedTestContainer | undefined;

  try {
    [postgres, redis] = await Promise.all([
      new GenericContainer('postgres:18-alpine')
        .withEnvironment({
          POSTGRES_DB: 'expense_tracker_test',
          POSTGRES_USER: 'expense_test',
          POSTGRES_PASSWORD: 'expense_test_password',
        })
        .withExposedPorts(5432)
        .start(),
      new GenericContainer('redis:8-alpine').withExposedPorts(6379).start(),
    ]);

    const environment = {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL:
        `postgresql://expense_test:expense_test_password@${postgres.getHost()}:` +
        `${postgres.getMappedPort(5432)}/expense_tracker_test?schema=public`,
      REDIS_URL: `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`,
    };

    run(['exec', 'prisma', 'migrate', 'deploy'], environment);
    run(['test:all'], environment);
  } finally {
    await Promise.allSettled([postgres?.stop(), redis?.stop()]);
  }
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
