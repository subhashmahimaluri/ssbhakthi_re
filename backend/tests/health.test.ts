import request from 'supertest';
import App from '../src/app';

describe('Health Endpoint', () => {
  let app: App;
  let server: any;

  beforeAll(async () => {
    app = new App();
    server = app.app;
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(() => {
    // Cleanup if needed
  });

  it('should return healthy status', async () => {
    const response = await request(server).get('/rest/health').expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
  });

  it('should return JSON content type', async () => {
    const response = await request(server).get('/rest/health').expect('Content-Type', /json/);

    expect(response.status).toBe(200);
  });

  it('should have proper response structure', async () => {
    const response = await request(server).get('/rest/health');

    expect(typeof response.body.status).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.uptime).toBe('number');
    expect(typeof response.body.environment).toBe('string');
    expect(typeof response.body.version).toBe('string');
  });
});
