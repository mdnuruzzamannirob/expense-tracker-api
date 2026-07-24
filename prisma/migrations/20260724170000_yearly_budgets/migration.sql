CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY', 'YEARLY');

ALTER TABLE "Budget"
  ADD COLUMN "period" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY',
  ALTER COLUMN "month" DROP NOT NULL;

DROP INDEX "Budget_userId_year_month_idx";
CREATE INDEX "Budget_userId_period_year_month_idx"
  ON "Budget"("userId", "period", "year", "month");
