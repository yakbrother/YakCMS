import { describe, it, expect } from 'vitest';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

describe('Authentication', () => {
  it('should handle successful login', async () => {
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json();
        
        if (body.email === 'test@example.com' && body.password === 'password123') {
          return HttpResponse.json({
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User'
            },
            token: 'mock-jwt-token'
          });
        }
        
        return new HttpResponse(null, { status: 401 });
      })
    );

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.user.email).toBe('test@example.com');
    expect(data.token).toBeDefined();
  });

  it('should handle invalid credentials', async () => {
    server.use(
      http.post('/api/auth/login', async () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpass'
      })
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });
});
