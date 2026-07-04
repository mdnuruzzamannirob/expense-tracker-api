# Expense Tracker & Personal Finance Management API

**Stack:** Express.js · PostgreSQL · Prisma ORM · Redis · JWT

---

## 1. Project Overview

A production-style REST API for personal finance management. Users can track income
and expenses, set category-wise budgets, define savings goals, view analytical
reports, and receive automated alerts when spending exceeds their budget. Built to
demonstrate relational database design, aggregation queries, background jobs, and
secure API architecture — not just CRUD.

## 2. Objective

To showcase:
- Relational schema design and complex joins/aggregations with PostgreSQL + Prisma
- Secure authentication (access + refresh token flow)
- Scheduled/background job handling (cron)
- Caching strategy with Redis
- Clean, testable, well-documented Express architecture

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (Express.js) |
| Database | PostgreSQL |
| ORM | Prisma |
| Caching | Redis |
| Auth | JWT (access + refresh token), bcrypt |
| Validation | Zod |
| Background Jobs | node-cron |
| File/Report Export | pdfkit / json2csv |
| Email | Nodemailer |
| Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Testing | Jest + Supertest |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Logging | Winston + Morgan |

---

## 4. Core Features (Must-Have)

### 4.1 Authentication & User Management
- Register / Login with hashed passwords (bcrypt)
- JWT access token + refresh token rotation
- Logout (refresh token invalidation)
- Forgot password / reset password via email token
- Get/update profile, change password
- Role support: `user`, `admin`

### 4.2 Category Management
- CRUD for custom categories (income/expense type)
- Default system categories seeded on registration
- Category has name, type, icon, color

### 4.3 Transaction Management
- CRUD for income/expense transactions
- Fields: amount, type, category, note, date, tags
- Filter by date range, category, type, tags
- Pagination + sorting
- Bulk import transactions via CSV upload
- Receipt/attachment upload (image URL via Cloudinary/S3)

### 4.4 Recurring Transactions
- Mark a transaction as recurring (daily/weekly/monthly)
- Cron job auto-generates the transaction on schedule
- Ability to pause/cancel a recurring rule

### 4.5 Budgeting
- Set monthly budget limit per category
- Real-time check: alert when spending crosses threshold (e.g. 80%, 100%)
- `/budgets/alerts` endpoint returns over-budget categories
- Optional email alert when budget exceeded (cron-checked)

### 4.6 Savings Goals
- Create a savings goal (title, target amount, deadline)
- Track contributions toward the goal
- Progress percentage calculation

### 4.7 Reports & Analytics
- Monthly / yearly summary (total income, expense, net savings)
- Category-wise breakdown (pie-chart-ready JSON)
- Income vs expense trend over time (line-chart-ready JSON)
- Export report as PDF or CSV
- Redis caching for expensive report queries (invalidated on new transaction)

### 4.8 Admin Panel (Basic)
- List all users, deactivate/reactivate a user
- View platform-wide stats (total users, total transaction volume)

---

## 5. Non-Functional Requirements

- **Security:** Helmet, CORS whitelist, rate limiting (express-rate-limit), input sanitization
- **Validation:** All request bodies validated with Zod schemas
- **Error Handling:** Centralized error-handling middleware with consistent error shape
- **Logging:** Request logging (Morgan) + application logging (Winston)
- **Environment Config:** `.env` validated at startup (fail fast on missing vars)
- **Testing:** Unit tests for services, integration tests for critical routes (auth, transactions, reports); target 70%+ coverage
- **Documentation:** Full Swagger UI at `/api/docs`
- **Containerization:** `docker-compose.yml` with app + PostgreSQL + Redis
- **CI:** GitHub Actions pipeline — lint → test → build on every push

---

## 6. Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  password      String
  role          Role      @default(USER)
  currency      String    @default("BDT")
  isActive      Boolean   @default(true)
  categories    Category[]
  transactions  Transaction[]
  budgets       Budget[]
  savingsGoals  SavingsGoal[]
  refreshTokens RefreshToken[]
  createdAt     DateTime  @default(now())
}

enum Role {
  USER
  ADMIN
}

model Category {
  id           String   @id @default(uuid())
  name         String
  type         TxnType
  icon         String?
  color        String?
  userId       String
  user         User @relation(fields: [userId], references: [id])
  transactions Transaction[]
  budgets      Budget[]
}

enum TxnType {
  INCOME
  EXPENSE
}

model Transaction {
  id            String    @id @default(uuid())
  amount        Float
  type          TxnType
  note          String?
  date          DateTime
  tags          String[]
  receiptUrl    String?
  isRecurring   Boolean   @default(false)
  recurringRule String?   // e.g. "MONTHLY"
  userId        String
  categoryId    String
  user          User @relation(fields: [userId], references: [id])
  category      Category @relation(fields: [categoryId], references: [id])
  createdAt     DateTime  @default(now())
}

model Budget {
  id             String @id @default(uuid())
  limit          Float
  alertThreshold Int    @default(80) // percentage
  month          Int
  year           Int
  userId         String
  categoryId     String
  user           User @relation(fields: [userId], references: [id])
  category       Category @relation(fields: [categoryId], references: [id])
}

model SavingsGoal {
  id            String   @id @default(uuid())
  title         String
  targetAmount  Float
  currentAmount Float    @default(0)
  deadline      DateTime
  userId        String
  user          User @relation(fields: [userId], references: [id])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User @relation(fields: [userId], references: [id])
  expiresAt DateTime
  revoked   Boolean  @default(false)
}
```

---

## 7. API Endpoints

```
Auth
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

Users
GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/password

Categories
GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id

Transactions
GET    /api/transactions?type=&category=&from=&to=&tag=&page=&limit=
POST   /api/transactions
POST   /api/transactions/import        (CSV bulk upload)
PATCH  /api/transactions/:id
DELETE /api/transactions/:id

Budgets
POST   /api/budgets
GET    /api/budgets?month=&year=
GET    /api/budgets/alerts
PATCH  /api/budgets/:id

Savings Goals
POST   /api/savings-goals
GET    /api/savings-goals
PATCH  /api/savings-goals/:id/contribute
DELETE /api/savings-goals/:id

Reports
GET    /api/reports/monthly?month=&year=
GET    /api/reports/yearly?year=
GET    /api/reports/category-breakdown?month=&year=
GET    /api/reports/trend?from=&to=
GET    /api/reports/export?type=pdf|csv&month=&year=

Admin
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
GET    /api/admin/stats
```

---

## 8. Folder Structure

```
expense-tracker-api/
├── src/
│   ├── config/            (env.js, db.js, redis.js)
│   ├── middlewares/       (auth.middleware.js, error.middleware.js, validate.middleware.js, rateLimiter.js)
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── category/
│   │   ├── transaction/
│   │   ├── budget/
│   │   ├── savingsGoal/
│   │   ├── report/
│   │   └── admin/
│   │       each module: controller.js, service.js, routes.js, validation.js
│   ├── jobs/               (recurringTransaction.job.js, budgetAlert.job.js)
│   ├── utils/              (jwt.js, response.js, pdfGenerator.js, csvGenerator.js, mailer.js)
│   ├── docs/                (swagger.js)
│   ├── app.js
│   └── server.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── tests/
│   ├── unit/
│   └── integration/
├── docker-compose.yml
├── Dockerfile
├── .github/workflows/ci.yml
├── .env.example
└── README.md
```

---

## 9. Development Roadmap

| Phase | Scope |
|---|---|
| 1 | Project setup, Prisma schema, Auth (register/login/refresh) |
| 2 | Category + Transaction CRUD, pagination & filtering |
| 3 | Reports & aggregation endpoints, Redis caching |
| 4 | Budgets + alert logic, Savings Goals |
| 5 | Recurring transactions (cron), CSV import, PDF/CSV export |
| 6 | Admin panel, email notifications |
| 7 | Testing (unit + integration), Swagger docs |
| 8 | Docker, CI/CD pipeline, deployment (Render/Railway) |

---

## 10. Suggested Resume Bullet Points

- Built a full-featured Expense Tracker REST API using **Express, PostgreSQL, and Prisma**, implementing JWT-based auth with refresh token rotation and role-based access control.
- Designed a relational schema supporting budgets, recurring transactions, and savings goals; used Prisma aggregation queries for monthly/yearly financial reports.
- Implemented Redis caching for report endpoints, reducing average response time by [X]%.
- Built cron-based background jobs for recurring transaction generation and automated budget-limit email alerts.
- Achieved 70%+ test coverage using Jest and Supertest; documented all endpoints with Swagger.
- Containerized the application with Docker Compose and set up a GitHub Actions CI pipeline for automated testing and build verification.
