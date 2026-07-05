import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/response.js';

const withProgress = <
  T extends { currentAmount: number; targetAmount: number },
>(
  goal: T,
) => ({
  ...goal,
  progressPercent:
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0,
});

const ensureOwned = async (userId: string, id: string) => {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new AppError(404, 'Savings goal not found');
  return goal;
};

export const create = async (
  userId: string,
  data: { title: string; targetAmount: number; deadline: string },
) =>
  withProgress(
    await prisma.savingsGoal.create({
      data: { ...data, deadline: new Date(data.deadline), userId },
    }),
  );

export const list = async (userId: string) => {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { deadline: 'asc' },
  });
  return goals.map(withProgress);
};

export const contribute = async (
  userId: string,
  id: string,
  amount: number,
) => {
  await ensureOwned(userId, id);
  return withProgress(
    await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: { increment: amount } },
    }),
  );
};

export const remove = async (userId: string, id: string) => {
  await ensureOwned(userId, id);
  await prisma.savingsGoal.delete({ where: { id } });
};
