import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import App from '../src/app';

describe('GraphQL API Tests', () => {
  let app: App;

  beforeAll(async () => {
    app = new App();
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('GraphQL Endpoint', () => {
    it('should respond to ping query', async () => {
      const query = {
        query: '{ ping }',
      };

      const response = await request(app.app).post('/graphql').send(query).expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.body?.singleResult?.data?.ping).toBe('pong');
    });

    it('should return error for invalid query', async () => {
      const query = {
        query: '{ invalidField }',
      };

      const response = await request(app.app).post('/graphql').send(query).expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.body?.singleResult?.errors).toBeDefined();
    });

    it('should serve GraphQL playground on GET request', async () => {
      const response = await request(app.app).get('/graphql').expect(200);

      expect(response.text).toContain('GraphQL Playground');
      expect(response.text).toContain('<!DOCTYPE html>');
    });
  });

  describe('REST Endpoints', () => {
    it('should respond to health check', async () => {
      const response = await request(app.app).get('/rest/health').expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.environment).toBe('test');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should respond to root endpoint', async () => {
      const response = await request(app.app).get('/').expect(200);

      expect(response.body.message).toBe('SSBhakthi API Server');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.graphql).toBe('/graphql');
    });
  });

  describe('Authentication Tests', () => {
    it('should allow unauthenticated ping query', async () => {
      const query = {
        query: '{ ping }',
      };

      const response = await request(app.app).post('/graphql').send(query).expect(200);

      expect(response.body.body?.singleResult?.data?.ping).toBe('pong');
    });

    it('should require authentication for me query', async () => {
      const query = {
        query: '{ me { id email } }',
      };

      const response = await request(app.app).post('/graphql').send(query).expect(200);

      expect(response.body.body?.singleResult?.errors).toBeDefined();
      expect(response.body.body?.singleResult?.errors[0]?.message).toContain(
        'Authentication required'
      );
    });

    it('should require role for protected mutations', async () => {
      const mutation = {
        query: `
          mutation {
            createArticle(input: {
              type: "blog"
              title: { en: "Test Article" }
              slug: { en: "test-article" }
              locales: ["en"]
            }) {
              id
              title {
                en
              }
            }
          }
        `,
      };

      const response = await request(app.app).post('/graphql').send(mutation).expect(200);

      expect(response.body.body?.singleResult?.errors).toBeDefined();
      expect(response.body.body?.singleResult?.errors[0]?.message).toContain(
        'Authentication required'
      );
    });
  });

  describe('Article Queries', () => {
    it('should return empty articles list', async () => {
      const query = {
        query: `
          {
            articles {
              items {
                id
                title {
                  en
                }
              }
              total
              hasNextPage
              hasPreviousPage
            }
          }
        `,
      };

      const response = await request(app.app).post('/graphql').send(query).expect(200);

      expect(response.body.body?.singleResult?.data?.articles).toBeDefined();
      expect(response.body.body?.singleResult?.data?.articles.items).toEqual([]);
      expect(response.body.body?.singleResult?.data?.articles.total).toBe(0);
    });

    it('should handle article filtering', async () => {
      const query = {
        query: `
          {
            articles(filters: { type: "blog", locale: "en" }, limit: 5) {
              items {
                id
                type
                locales
              }
              total
            }
          }
        `,
      };

      const response = await request(app.app).post('/graphql').send(query).expect(200);

      expect(response.body.body?.singleResult?.data?.articles).toBeDefined();
      expect(response.body.body?.singleResult?.data?.articles.items).toEqual([]);
    });
  });
});
