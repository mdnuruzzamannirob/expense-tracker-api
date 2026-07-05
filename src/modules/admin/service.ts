import { prisma } from '../../config/db.js';

export const users = async () =>
  prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      currency: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

export const updateStatus = async (id: string, isActive: boolean) =>
  prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

export const stats = async () => {
  const [totalUsers, activeUsers, volume, transactions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.transaction.aggregate({ _sum: { amount: true } }),
    prisma.transaction.count(),
  ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    totalTransactions: transactions,
    totalTransactionVolume: volume._sum.amount ?? 0,
  };
};
