import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/config/db.js';
import { readCookie } from '../helpers/auth.js';

describe('V2 feature integration tests', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const registered = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'V2 User',
        email: 'v2@example.com',
        password: 'password123',
        currency: 'USD',
      })
      .expect(201);

    token = readCookie(registered.headers['set-cookie'], 'accessToken')!;
    userId = registered.body.data.user.id;
  });

  it('returns the dashboard snapshot', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.monthlySummary).toBeDefined();
    expect(response.body.data.budgetProgress).toBeInstanceOf(Array);
    expect(response.body.data.savingsSnapshot.goals).toBeInstanceOf(Array);
  });

  it('returns seeded plans and the current trial subscription', async () => {
    const plans = await request(app)
      .get('/api/billing/plans')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(
      plans.body.data.map((plan: { slug: string }) => plan.slug).sort(),
    ).toEqual(['free', 'pro-monthly', 'pro-yearly', 'unlimited'].sort());

    const subscription = await request(app)
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(subscription.body.data.status).toBe('TRIALING');
    expect(subscription.body.data.plan.slug).toBe('pro-monthly');
  });

  it('creates a Pro family group and reads its aggregate transactions', async () => {
    const created = await request(app)
      .post('/api/family/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Household' })
      .expect(201);

    const groups = await request(app)
      .get('/api/family/groups')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(groups.body.data).toHaveLength(1);
    expect(groups.body.data[0].id).toBe(created.body.data.id);

    const transactions = await request(app)
      .get(`/api/family/groups/${created.body.data.id}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(transactions.body.data.group.id).toBe(created.body.data.id);
    expect(transactions.body.data.transactions).toEqual([]);
  });

  it('lists and marks in-app notifications as read', async () => {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Test notification',
        message: 'A test notification',
      },
    });

    const list = await request(app)
      .get('/api/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.data).toHaveLength(1);

    await request(app)
      .patch(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);

    const unread = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(unread.body.data.count).toBe(0);
  });
});
