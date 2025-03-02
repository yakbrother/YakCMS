import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, post, put, del } from '../posts';
import { getCollection, getEntry, updateEntry, deleteEntry } from 'astro:content';

// Mock Astro content collections
vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
  getEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn()
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Posts API', () => {
  describe('GET handler', () => {
    it('should handle pagination', async () => {
      const mockPosts = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        title: `Test Post ${i + 1}`
      }));

      vi.mocked(getCollection).mockResolvedValueOnce(mockPosts);

      const response = await get({ params: { page: '1', limit: '10' } } as any);
      const data = await response.json();

      expect(data.posts).toHaveLength(10);
      expect(data.totalPages).toBe(2);
      expect(data.currentPage).toBe(1);
    });

    it('should filter posts by status', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', status: 'published' },
        { id: '2', title: 'Post 2', status: 'draft' }
      ];

      vi.mocked(getCollection).mockResolvedValueOnce(mockPosts);

      const response = await get({ params: { status: 'published' } } as any);
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].status).toBe('published');
    });

    it('should handle search queries', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post', content: 'abc' },
        { id: '2', title: 'Another Post', content: 'xyz' }
      ];

      vi.mocked(getCollection).mockResolvedValueOnce(mockPosts);

      const response = await get({ params: { search: 'Test' } } as any);
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].title).toContain('Test');
    });
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

  describe('PUT handler', () => {
    it('should update an existing post', async () => {
      const mockPost = {
        id: '1',
        title: 'Updated Post',
        content: 'Updated content'
      };

      vi.mocked(getEntry).mockResolvedValueOnce({ id: '1', title: 'Old Title' });
      vi.mocked(updateEntry).mockResolvedValueOnce(mockPost);

      const request = new Request('http://localhost/api/posts/1', {
        method: 'PUT',
        body: JSON.stringify(mockPost)
      });

      const response = await put({ request, params: { id: '1' } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPost);
    });

    it('should handle concurrent updates', async () => {
      const mockPost = { id: '1', version: 2 };
      const request = new Request('http://localhost/api/posts/1', {
        method: 'PUT',
        body: JSON.stringify({ ...mockPost, version: 1 })
      });

      vi.mocked(getEntry).mockResolvedValueOnce(mockPost);

      const response = await put({ request, params: { id: '1' } } as any);
      expect(response.status).toBe(409);
    });
  });

  describe('DELETE handler', () => {
    it('should delete a post', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce({ id: '1' });
      vi.mocked(deleteEntry).mockResolvedValueOnce(true);

      const response = await del({ params: { id: '1' } } as any);
      expect(response.status).toBe(200);
    });

    it('should handle deletion of non-existent post', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce(null);

      const response = await del({ params: { id: 'nonexistent' } } as any);
      expect(response.status).toBe(404);
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

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost/api/posts', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await post({ request } as any);
      expect(response.status).toBe(400);
    });

    it('should handle rate limiting', async () => {
      // Simulate multiple rapid requests
      const requests = Array.from({ length: 5 }, () => {
        return post({
          request: new Request('http://localhost/api/posts', {
            method: 'POST',
            body: JSON.stringify({ title: 'Test', content: 'Content' })
          })
        } as any);
      });

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.some(r => r.status === 429);
      expect(tooManyRequests).toBe(true);
    });
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
