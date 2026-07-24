import { prisma } from '../../config/db.js';
import type {
  Budget,
  BudgetPeriod,
  Prisma,
} from '../../generated/prisma/client.js';
import {
  enforceLimit,
  getEntitlements,
} from '../../services/subscription.service.js';
import { AppError } from '../../utils/response.js';

type BudgetInput = {
  limit: number;
  alertThreshold: number;
  period: BudgetPeriod;
  month?: number | null;
  year: number;
  categoryId?: string | null;
  rollover: boolean;
};

const ensureExpenseCategory = async (userId: string, categoryId?: string | null) => {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      type: 'EXPENSE',
      OR: [{ userId }, { userId: null }],
    },
  });
  if (!category) throw new AppError(400, 'Visible expense category not found');
};

const ensureOwned = async (userId: string, id: string) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new AppError(404, 'Budget not found');
  return budget;
};

const ensureUnique = async (
  userId: string,
  categoryId: string | null | undefined,
  period: BudgetPeriod,
  month: number | null,
  year: number,
  excludeId?: string,
) => {
  const existing = await prisma.budget.findFirst({
    where: {
      userId,
      period,
      categoryId: categoryId ?? null,
      month,
      year,
      id: excludeId ? { not: excludeId } : undefined,
    },
  });
  if (existing) throw new AppError(409, 'A matching budget already exists');
};

const expenseWhere = (budget: Budget, start: Date, end: Date): Prisma.TransactionWhereInput => ({
  userId: budget.userId,
  type: 'EXPENSE',
  categoryId: budget.categoryId ?? undefined,
  date: { gte: start, lt: end },
});

const dateRange = (budget: Pick<Budget, 'period' | 'year' | 'month'>) =>
  budget.period === 'YEARLY'
    ? {
        start: new Date(Date.UTC(budget.year, 0, 1)),
        end: new Date(Date.UTC(budget.year + 1, 0, 1)),
      }
    : {
        start: new Date(Date.UTC(budget.year, budget.month! - 1, 1)),
        end: new Date(Date.UTC(budget.year, budget.month!, 1)),
      };

export const calculateBudgetProgress = async (budget: Budget) => {
  const { start, end } = dateRange(budget);
  const total = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: expenseWhere(budget, start, end),
  });
  const spent = total._sum?.amount?.toNumber() ?? 0;
  let rolledOver = 0;

  if (budget.rollover) {
    const previousDate =
      budget.period === 'YEARLY'
        ? new Date(Date.UTC(budget.year - 1, 0, 1))
        : new Date(Date.UTC(budget.year, budget.month! - 2, 1));
    const previous = await prisma.budget.findFirst({
      where: {
        userId: budget.userId,
        period: budget.period,
        categoryId: budget.categoryId,
        month:
          budget.period === 'YEARLY'
            ? null
            : previousDate.getUTCMonth() + 1,
        year: previousDate.getUTCFullYear(),
      },
    });
    if (previous) {
      const previousPeriod = dateRange(previous);
      const previousTotal = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: expenseWhere(previous, previousPeriod.start, previousPeriod.end),
      });
      rolledOver = Math.max(
        previous.limit.toNumber() - (previousTotal._sum?.amount?.toNumber() ?? 0),
        0,
      );
    }
  }

  const effectiveLimit = budget.limit.toNumber() + rolledOver;
  const percentUsed = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : 0;
  return {
    spent,
    rolledOver,
    effectiveLimit,
    percentUsed,
    thresholdCrossed: percentUsed >= budget.alertThreshold,
    overBudget: spent > effectiveLimit,
  };
};

export const create = async (userId: string, data: BudgetInput) => {
  const { limits } = await getEntitlements(userId);
  const count = await prisma.budget.count({ where: { userId } });
  enforceLimit(count, limits.maxBudgets, 'budgets');
  await ensureExpenseCategory(userId, data.categoryId);
  const month = data.period === 'YEARLY' ? null : data.month;
  if (data.period === 'MONTHLY' && month == null) {
    throw new AppError(400, 'Month is required for a monthly budget');
  }
  await ensureUnique(
    userId,
    data.categoryId,
    data.period,
    month ?? null,
    data.year,
  );
  return prisma.budget.create({
    data: {
      ...data,
      month,
      userId,
      categoryId: data.categoryId ?? null,
    },
    include: { category: true },
  });
};

export const list = async (
  userId: string,
  query: {
    month?: number;
    year?: number;
    period?: BudgetPeriod;
    page: number;
    limit: number;
  },
) => {
  const where = {
    userId,
    month: query.month,
    year: query.year,
    period: query.period,
  };
  const skip = (query.page - 1) * query.limit;
  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.budget.count({ where }),
  ]);
  const items = await Promise.all(
    budgets.map(async (budget) => ({
      ...budget,
      progress: await calculateBudgetProgress(budget),
    })),
  );
  return {
    items,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
};

export const update = async (
  userId: string,
  id: string,
  data: Partial<BudgetInput>,
) => {
  const current = await ensureOwned(userId, id);
  const categoryId = data.categoryId !== undefined ? data.categoryId : current.categoryId;
  const budgetPeriod = data.period ?? current.period;
  const month =
    budgetPeriod === 'YEARLY'
      ? null
      : data.month !== undefined
        ? data.month
        : current.month;
  if (budgetPeriod === 'MONTHLY' && month == null) {
    throw new AppError(400, 'Month is required for a monthly budget');
  }
  const year = data.year ?? current.year;
  await ensureExpenseCategory(userId, categoryId);
  await ensureUnique(
    userId,
    categoryId,
    budgetPeriod,
    month,
    year,
    id,
  );
  return prisma.budget.update({
    where: { id },
    data: { ...data, period: budgetPeriod, month, categoryId },
    include: { category: true },
  });
};

export const alerts = async (userId: string) => {
  const now = new Date();
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      year: now.getUTCFullYear(),
      OR: [
        { period: 'MONTHLY', month: now.getUTCMonth() + 1 },
        { period: 'YEARLY', month: null },
      ],
    },
    include: { category: true },
  });
  const items = await Promise.all(
    budgets.map(async (budget) => ({
      ...budget,
      ...(await calculateBudgetProgress(budget)),
    })),
  );
  return items.filter((item) => item.thresholdCrossed);
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.budget.delete({ where: { id } });
};
