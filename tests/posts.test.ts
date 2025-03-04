import { describe, it, expect } from 'vitest';
import { server, BASE_URL } from './setup';
import { http, HttpResponse } from 'msw';

describe('Posts API', () => {
  const mockPost = {
    id: '1',
    title: 'Test Post',
    content: '# Test Content',
    author: 'default',
    status: 'published',
    createdAt: '2025-03-04T11:51:14.000Z',
    updatedAt: '2025-03-04T11:51:14.000Z'
  };

  it('should fetch a post by ID', async () => {
    console.log('Setting up mock for:', `${BASE_URL}/api/posts/1`);
    server.use(
      http.get(`${BASE_URL}/api/posts/1`, () => {
        return HttpResponse.json(mockPost, { status: 200 });
      })
    );

    console.log('Making request to:', `${BASE_URL}/api/posts/1`);
    const response = await fetch(`${BASE_URL}/api/posts/1`);
    console.log('Response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    });
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    console.log('Response data:', data);
    expect(data.id).toBe('1');
    expect(data.title).toBe('Test Post');
  });

  it('should return 404 for non-existent post', async () => {
    server.use(
      http.get(`${BASE_URL}/api/posts/999`, () => {
        return new HttpResponse(JSON.stringify({ error: 'Post not found' }), { status: 404 });
      })
    );

    const response = await fetch(`${BASE_URL}/api/posts/999`);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});
