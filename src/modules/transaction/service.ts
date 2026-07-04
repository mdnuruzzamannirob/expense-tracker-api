import { prisma } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { AppError } from '../../utils/response.js';

type ListQuery = {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  from?: string;
  to?: string;
  tag?: string;
  page: number;
  limit: number;
  sortBy: 'date' | 'amount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
};

type TransactionInput = {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  note?: string;
  date: string;
  tags: string[];
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringRule?: string;
};

const invalidateReports = async (userId: string) => {
  const keys = await redis.keys(`reports:${userId}:*`);
  if (keys.length) await redis.del(...keys);
};

const ensureCategory = async (userId: string, categoryId: string, type?: 'INCOME' | 'EXPENSE') => {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new AppError(404, 'Category not found');
  if (type && category.type !== type) throw new AppError(400, 'Category type does not match transaction type');
};

const ensureOwned = async (userId: string, id: string) => {
  const transaction = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!transaction) throw new AppError(404, 'Transaction not found');
  return transaction;
};

export const list = async (userId: string, query: ListQuery) => {
  const where = {
    userId,
    type: query.type,
    categoryId: query.category,
    tags: query.tag ? { has: query.tag } : undefined,
    date: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
  };
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) } };
};

export const create = async (userId: string, input: TransactionInput) => {
  await ensureCategory(userId, input.categoryId, input.type);
  const transaction = await prisma.transaction.create({
    data: { ...input, date: new Date(input.date), userId },
  });
  await invalidateReports(userId);
  return transaction;
};

export const update = async (userId: string, id: string, input: Partial<TransactionInput>) => {
  const current = await ensureOwned(userId, id);
  if (input.categoryId || input.type) {
    await ensureCategory(userId, input.categoryId ?? current.categoryId, input.type ?? current.type);
  }
  const transaction = await prisma.transaction.update({
    where: { id },
    data: { ...input, date: input.date ? new Date(input.date) : undefined },
  });
  await invalidateReports(userId);
  return transaction;
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.transaction.delete({ where: { id } });
  await invalidateReports(userId);
};

export const importCsv = async (userId: string, csv: string) => {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  if (!headerLine) throw new AppError(400, 'CSV file is empty');
  const headers = headerLine.split(',').map((item) => item.trim());

  const created = [];
  for (const row of rows) {
    if (!row.trim()) continue;
    const values = row.split(',').map((item) => item.trim());
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const input: TransactionInput = {
      amount: Number(record.amount),
      type: record.type as 'INCOME' | 'EXPENSE',
      categoryId: record.categoryId,
      note: record.note || undefined,
      date: record.date,
      tags: record.tags ? record.tags.split('|').map((tag) => tag.trim()) : [],
      receiptUrl: record.receiptUrl || undefined,
      isRecurring: record.isRecurring === 'true',
      recurringRule: record.recurringRule || undefined,
    };
    created.push(await create(userId, input));
  }

  return created;
};
