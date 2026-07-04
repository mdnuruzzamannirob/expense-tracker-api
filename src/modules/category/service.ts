import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/response.js';

export const list = async (userId: string) =>
  prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });

export const create = async (
  userId: string,
  data: { name: string; type: 'INCOME' | 'EXPENSE'; icon?: string; color?: string },
) => prisma.category.create({ data: { ...data, userId } });

export const update = async (
  userId: string,
  id: string,
  data: { name?: string; type?: 'INCOME' | 'EXPENSE'; icon?: string; color?: string },
) => {
  await ensureOwned(userId, id);
  return prisma.category.update({ where: { id }, data });
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.category.delete({ where: { id } });
};

const ensureOwned = async (userId: string, id: string) => {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new AppError(404, 'Category not found');
  return category;
};
