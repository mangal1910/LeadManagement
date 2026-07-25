const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Lead = require('../models/Lead');

require('./setup');

describe('Auth & Role-Based Access Control (RBAC) Tests', () => {
  let adminTokenCookie;
  let memberTokenCookie;
  let adminUser;
  let memberUser;
  let createdLeadId;

  beforeEach(async () => {
    // 1. Create Admin User
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN'
    });
    adminTokenCookie = adminRes.headers['set-cookie'];
    adminUser = adminRes.body.user;

    // 2. Create Member User
    const memberRes = await request(app).post('/api/auth/register').send({
      name: 'Team Member',
      email: 'member@example.com',
      password: 'password123',
      role: 'MEMBER'
    });
    memberTokenCookie = memberRes.headers['set-cookie'];
    memberUser = memberRes.body.user;

    // 3. Create a test lead
    const lead = await Lead.create({
      name: 'Test Lead Company',
      email: 'contact@testlead.com',
      company: 'Test Corp',
      status: 'NEW'
    });
    createdLeadId = lead._id.toString();
  });

  test('1. Successful Login sets HTTP-only cookie and returns user profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('admin@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('token=');
  });

  test('2. MEMBER cannot access ADMIN-only route (DELETE /api/leads/:id)', async () => {
    const res = await request(app)
      .delete(`/api/leads/${createdLeadId}`)
      .set('Cookie', memberTokenCookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Admin role required');
  });

  test('3. ADMIN can access ADMIN-only route (DELETE /api/leads/:id)', async () => {
    const res = await request(app)
      .delete(`/api/leads/${createdLeadId}`)
      .set('Cookie', adminTokenCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted successfully');
  });

  test('4. MEMBER cannot reassign leads', async () => {
    const res = await request(app)
      .put(`/api/leads/${createdLeadId}`)
      .set('Cookie', memberTokenCookie)
      .send({ assignedTo: memberUser.id });

    // Since lead wasn't assigned to member, member is blocked from updating
    expect(res.statusCode).toBe(403);
  });
});
