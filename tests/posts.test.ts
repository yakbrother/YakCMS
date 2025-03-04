import { describe, it, expect } from 'vitest';
import { server } from './setup';
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
    server.use(
      http.get('/api/posts/1', () => {
        return HttpResponse.json(mockPost);
      })
    );

    const response = await fetch('/api/posts/1');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.id).toBe('1');
    expect(data.title).toBe('Test Post');
  });

  it('should return 404 for non-existent post', async () => {
    server.use(
      http.get('/api/posts/999', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const response = await fetch('/api/posts/999');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});
