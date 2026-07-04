# Expense Tracker API

Production-style REST API foundation for personal finance management using Express,
TypeScript, PostgreSQL, Prisma, Redis, JWT, Swagger, Docker, and CI.

## Getting Started

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

The API starts on `http://localhost:5000` by default.

## Useful Commands

```bash
pnpm dev              # run with tsx watch
pnpm build            # compile TypeScript
pnpm start            # run dist/server.js
pnpm test             # run Jest with coverage
pnpm run lint         # lint src
pnpm prisma:seed      # seed admin user and starter categories
```

## Docker

```bash
docker compose up --build
```

Services:

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Environment

See `.env.example` for all supported variables. The app validates required
environment variables at startup and exits fast if any are missing or invalid.

## Current Scope

This pass completes the project scaffolding outside `src/modules`: app startup,
config, database and Redis clients, middleware, helpers, cron jobs, Swagger,
Docker, CI, Prisma seed, and documentation. Feature route implementations live in
`src/modules`.
