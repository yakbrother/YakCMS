import { describe, it, expect, vi } from 'vitest';
import { get, post } from '../posts';
import { getCollection, getEntry } from 'astro:content';

// Mock Astro content collections
vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
  getEntry: vi.fn()
}));

describe('Posts API', () => {
  describe('GET handler', () => {
    it('should return all posts when no id is provided', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post 1' },
        { id: '2', title: 'Test Post 2' }
      ];

      vi.mocked(getCollection).mockResolvedValueOnce(mockPosts);

      const response = await get({ params: {} } as any);
      const data = await response.json();

      expect(data).toEqual(mockPosts);
      expect(response.status).toBe(200);
    });

    it('should return a single post when id is provided', async () => {
      const mockPost = { id: '1', title: 'Test Post 1' };
      vi.mocked(getEntry).mockResolvedValueOnce(mockPost);

      const response = await get({ params: { id: '1' } } as any);
      const data = await response.json();

      expect(data).toEqual(mockPost);
      expect(response.status).toBe(200);
    });

    it('should return 404 when post is not found', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce(null);

      const response = await get({ params: { id: 'nonexistent' } } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST handler', () => {
    it('should create a new post', async () => {
      const mockPost = {
        title: 'New Post',
        content: 'Test content',
        status: 'draft'
      };

      const request = new Request('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPost)
      });

      const response = await post({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('slug');
    });

    it('should handle scheduled posts', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const mockPost = {
        title: 'Scheduled Post',
        content: 'Test content',
        status: 'scheduled',
        publishDate: futureDate.toISOString(),
        timezone: 'UTC'
      };

      const request = new Request('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPost)
      });

      const response = await post({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data.frontmatter).toHaveProperty('publishDate');
      expect(data.frontmatter).toHaveProperty('draft', true);
    });

    it('should validate required fields', async () => {
      const mockPost = {
        content: 'Test content'
        // Missing title
      };

      const request = new Request('http://localhost/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPost)
      });

      const response = await post({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });
});
