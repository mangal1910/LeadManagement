const request = require('supertest');
const app = require('../app');
const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const Note = require('../models/Note');

require('./setup');

describe('Core Lead Lifecycle & Activity Log Tests', () => {
  let adminTokenCookie;
  let adminUser;

  beforeEach(async () => {
    // Setup Admin user
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Sales Manager Admin',
      email: 'manager@example.com',
      password: 'password123',
      role: 'ADMIN'
    });
    adminTokenCookie = adminRes.headers['set-cookie'];
    adminUser = adminRes.body.user;
  });

  test('Complete Flow: Public lead capture -> Update Status -> Add Note -> Verify Activity Logs', async () => {
    // 1. Create lead via public capture form
    const publicRes = await request(app).post('/api/leads/public').send({
      name: 'John Prospect',
      email: 'john@acme.com',
      phone: '123-456-7890',
      company: 'Acme Corp'
    });

    expect(publicRes.statusCode).toBe(201);
    expect(publicRes.body.success).toBe(true);
    const leadId = publicRes.body.lead._id;
    expect(publicRes.body.lead.status).toBe('NEW');

    // Verify initial Activity Log created for public submission
    const initialLogs = await ActivityLog.find({ leadId });
    expect(initialLogs.length).toBe(1);
    expect(initialLogs[0].actionType).toBe('LEAD_CREATED');
    expect(initialLogs[0].description).toBe('Lead submitted via public capture form');

    // 2. Admin updates lead status to 'QUALIFIED'
    const updateRes = await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Cookie', adminTokenCookie)
      .send({ status: 'QUALIFIED' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.lead.status).toBe('QUALIFIED');

    // Verify STATUS_CHANGE Activity Log generated
    const statusLogs = await ActivityLog.find({ leadId, actionType: 'STATUS_CHANGE' });
    expect(statusLogs.length).toBe(1);
    expect(statusLogs[0].description).toContain('Status changed from "NEW" to "QUALIFIED"');

    // 3. Admin adds a note
    const noteRes = await request(app)
      .post(`/api/leads/${leadId}/notes`)
      .set('Cookie', adminTokenCookie)
      .send({ content: 'Called client, confirmed budget and requirement.' });

    expect(noteRes.statusCode).toBe(201);
    expect(noteRes.body.note.content).toBe('Called client, confirmed budget and requirement.');

    // Verify NOTE_ADDED Activity Log generated
    const noteLogs = await ActivityLog.find({ leadId, actionType: 'NOTE_ADDED' });
    expect(noteLogs.length).toBe(1);

    // 4. Fetch full lead details with notes & activity trail
    const detailsRes = await request(app)
      .get(`/api/leads/${leadId}`)
      .set('Cookie', adminTokenCookie);

    expect(detailsRes.statusCode).toBe(200);
    expect(detailsRes.body.lead.status).toBe('QUALIFIED');
    expect(detailsRes.body.notes.length).toBe(1);
    expect(detailsRes.body.activityLogs.length).toBe(3); // LEAD_CREATED, STATUS_CHANGE, NOTE_ADDED
  });
});
