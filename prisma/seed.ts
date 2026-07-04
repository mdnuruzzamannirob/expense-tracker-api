import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const defaultCategories = [
  { name: 'Salary', type: 'INCOME' as const, icon: 'wallet', color: '#1f9d55' },
  {
    name: 'Freelance',
    type: 'INCOME' as const,
    icon: 'briefcase',
    color: '#2563eb',
  },
  {
    name: 'Food',
    type: 'EXPENSE' as const,
    icon: 'utensils',
    color: '#f97316',
  },
  {
    name: 'Transport',
    type: 'EXPENSE' as const,
    icon: 'car',
    color: '#7c3aed',
  },
  {
    name: 'Bills',
    type: 'EXPENSE' as const,
    icon: 'receipt',
    color: '#dc2626',
  },
]

const main = async () => {
  const password = await bcrypt.hash('Password123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password,
      role: 'ADMIN',
      currency: 'BDT',
    },
  })

  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: admin.id, name: category.name, type: category.type },
    })

    if (!existing) {
      await prisma.category.create({ data: { ...category, userId: admin.id } })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
