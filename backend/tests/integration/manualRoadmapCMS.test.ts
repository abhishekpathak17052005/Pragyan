import request from 'supertest';
import app from '@/app';
import { generateAccessToken } from '@/utils/jwt';
import { prisma } from '@/lib/prisma';

describe('Manual Roadmap CMS Integration Tests', () => {
  let adminToken: string;
  let testCareerId: string;
  let testModuleId: string;
  let testWeekId: string;
  let testDayId: string;
  let testTopicId: string;
  let testResourceId: string;

  beforeAll(() => {
    adminToken = generateAccessToken({
      id: 'admin-test-id',
      email: 'admin@pragyan.com',
      role: 'ADMIN',
    });
  });

  afterAll(async () => {
    // Cleanup any created entities in reverse order of relationships
    try {
      if (testResourceId) {
        await prisma.careerRoadmapResource.deleteMany({ where: { id: testResourceId } });
      }
      if (testTopicId) {
        await prisma.careerRoadmapTopic.deleteMany({ where: { id: testTopicId } });
      }
      if (testDayId) {
        await prisma.careerRoadmapDay.deleteMany({ where: { id: testDayId } });
      }
      if (testWeekId) {
        await prisma.careerRoadmapWeek.deleteMany({ where: { id: testWeekId } });
      }
      if (testModuleId) {
        await prisma.careerRoadmapModule.deleteMany({ where: { id: testModuleId } });
      }
      if (testCareerId) {
        await prisma.careerRoadmap.deleteMany({ where: { id: testCareerId } });
      }
    } catch (e) {
      console.warn('Cleanup failed (expected if already deleted):', e);
    }
  });

  it('1. GET /api/admin/careers - should return a list of careers', async () => {
    const res = await request(app)
      .get('/api/admin/careers')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('2. POST /api/admin/career - should create a career', async () => {
    const res = await request(app)
      .post('/api/admin/career')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Engineering Specialty',
        title: 'Test Engineering Specialty',
        description: 'Test Description for Career',
        slug: `test-eng-${Date.now()}`,
        status: 'draft',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testCareerId = res.body.data.id;
  });

  it('3. PUT /api/admin/career/:id - should update a career', async () => {
    const res = await request(app)
      .put(`/api/admin/career/${testCareerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Test Engineering Specialty',
        title: 'Updated Test Engineering Specialty',
        description: 'Updated Description for Career',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Test Engineering Specialty');
  });

  it('4. POST /api/admin/module - should create a module', async () => {
    const res = await request(app)
      .post('/api/admin/module')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        careerId: testCareerId,
        title: 'Test Module',
        description: 'Test Module Description',
        order: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testModuleId = res.body.data.id;
  });

  it('5. PUT /api/admin/module/:id - should update a module', async () => {
    const res = await request(app)
      .put(`/api/admin/module/${testModuleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Test Module',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Test Module');
  });

  it('6. POST /api/admin/week - should create a week', async () => {
    const res = await request(app)
      .post('/api/admin/week')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        moduleId: testModuleId,
        weekNumber: 1,
        title: 'Test Week 1',
        description: 'Test Week Description',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testWeekId = res.body.data.id;
  });

  it('7. PUT /api/admin/week/:id - should update a week', async () => {
    const res = await request(app)
      .put(`/api/admin/week/${testWeekId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Test Week 1',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Test Week 1');
  });

  it('8. POST /api/admin/day - should create a day', async () => {
    const res = await request(app)
      .post('/api/admin/day')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        weekId: testWeekId,
        dayNumber: 1,
        title: 'Test Day 1',
        description: 'Test Day Description',
        estimatedHours: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testDayId = res.body.data.id;
  });

  it('9. PUT /api/admin/day/:id - should update a day', async () => {
    const res = await request(app)
      .put(`/api/admin/day/${testDayId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Test Day 1',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Test Day 1');
  });

  it('10. POST /api/admin/topic - should create a topic', async () => {
    const res = await request(app)
      .post('/api/admin/topic')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        dayId: testDayId,
        title: 'Test Topic 1',
        description: 'Test Topic Description',
        objective: 'Test Objective',
        order: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testTopicId = res.body.data.id;
  });

  it('11. PUT /api/admin/topic/:id - should update a topic', async () => {
    const res = await request(app)
      .put(`/api/admin/topic/${testTopicId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Test Topic 1',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Test Topic 1');
  });

  it('12. POST /api/admin/resource - should create a resource', async () => {
    const res = await request(app)
      .post('/api/admin/resource')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: testTopicId,
        title: 'Test Resource',
        url: 'https://example.com/test-resource',
        provider: 'Example Provider',
        type: 'DOCUMENTATION',
        difficulty: 'BEGINNER',
        language: 'en',
        free: true,
        verified: true,
        displayOrder: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    testResourceId = res.body.data.id;
  });

  it('13. PUT /api/admin/resource/:id - should update a resource', async () => {
    const res = await request(app)
      .put(`/api/admin/resource/${testResourceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Test Resource',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Test Resource');
  });

  it('14. PUT /api/admin/publish/:careerId - should publish the career', async () => {
    const res = await request(app)
      .put(`/api/admin/publish/${testCareerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        published: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('published');
  });

  it('15. DELETE /api/admin/resource/:id - should delete a resource', async () => {
    const res = await request(app)
      .delete(`/api/admin/resource/${testResourceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('16. DELETE /api/admin/topic/:id - should delete a topic', async () => {
    const res = await request(app)
      .delete(`/api/admin/topic/${testTopicId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('17. DELETE /api/admin/day/:id - should delete a day', async () => {
    const res = await request(app)
      .delete(`/api/admin/day/${testDayId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('18. DELETE /api/admin/week/:id - should delete a week', async () => {
    const res = await request(app)
      .delete(`/api/admin/week/${testWeekId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('19. DELETE /api/admin/module/:id - should delete a module', async () => {
    const res = await request(app)
      .delete(`/api/admin/module/${testModuleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('20. DELETE /api/admin/career/:id - should delete a career', async () => {
    const res = await request(app)
      .delete(`/api/admin/career/${testCareerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
