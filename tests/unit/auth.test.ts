import { describe, it, expect } from 'vitest';
import { server, BASE_URL } from './setup';
import { http, HttpResponse } from 'msw';

describe('Authentication', () => {
  it('should handle successful login', async () => {
    console.log('Setting up mock for:', `${BASE_URL}/api/auth/login`);
    server.use(
      http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
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

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    console.log('Response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });
    expect(response.ok).toBe(true);
    const data = await response.json();
    console.log('Response data:', data);
    expect(data.user.email).toBe('test@example.com');
    expect(data.token).toBeDefined();
  });

  it('should handle invalid credentials', async () => {
    server.use(
      http.post(`${BASE_URL}/api/auth/login`, async () => {
        return new HttpResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
      })
    );

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
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
