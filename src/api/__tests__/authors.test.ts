import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, post, put, del } from '../authors';
import { getCollection, getEntry, updateEntry, deleteEntry } from 'astro:content';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
  getEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn()
}));

describe('Authors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET handler', () => {
    it('should return all authors', async () => {
      const mockAuthors = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ];

      vi.mocked(getCollection).mockResolvedValueOnce(mockAuthors);

      const response = await get({ params: {} } as any);
      const data = await response.json();

      expect(data).toEqual(mockAuthors);
      expect(response.status).toBe(200);
    });

    it('should return a single author', async () => {
      const mockAuthor = { id: '1', name: 'John Doe', email: 'john@example.com' };
      vi.mocked(getEntry).mockResolvedValueOnce(mockAuthor);

      const response = await get({ params: { id: '1' } } as any);
      const data = await response.json();

      expect(data).toEqual(mockAuthor);
      expect(response.status).toBe(200);
    });

    it('should handle non-existent author', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce(null);

      const response = await get({ params: { id: 'nonexistent' } } as any);
      expect(response.status).toBe(404);
    });
  });

  describe('POST handler', () => {
    it('should create a new author', async () => {
      const mockAuthor = {
        name: 'New Author',
        email: 'new@example.com',
        bio: 'Test bio'
      };

      const request = new Request('http://localhost/api/authors', {
        method: 'POST',
        body: JSON.stringify(mockAuthor)
      });

      const response = await post({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(mockAuthor.name);
    });

    it('should validate required fields', async () => {
      const mockAuthor = {
        // Missing name
        email: 'test@example.com'
      };

      const request = new Request('http://localhost/api/authors', {
        method: 'POST',
        body: JSON.stringify(mockAuthor)
      });

      const response = await post({ request } as any);
      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const mockAuthor = {
        name: 'Test Author',
        email: 'invalid-email'
      };

      const request = new Request('http://localhost/api/authors', {
        method: 'POST',
        body: JSON.stringify(mockAuthor)
      });

      const response = await post({ request } as any);
      expect(response.status).toBe(400);
    });
  });

  describe('PUT handler', () => {
    it('should update an existing author', async () => {
      const mockAuthor = {
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      vi.mocked(getEntry).mockResolvedValueOnce({ id: '1', name: 'Old Name' });
      vi.mocked(updateEntry).mockResolvedValueOnce(mockAuthor);

      const request = new Request('http://localhost/api/authors/1', {
        method: 'PUT',
        body: JSON.stringify(mockAuthor)
      });

      const response = await put({ request, params: { id: '1' } } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAuthor);
    });

    it('should prevent duplicate emails', async () => {
      const existingAuthor = {
        id: '2',
        email: 'existing@example.com'
      };

      vi.mocked(getCollection).mockResolvedValueOnce([existingAuthor]);

      const request = new Request('http://localhost/api/authors/1', {
        method: 'PUT',
        body: JSON.stringify({
          id: '1',
          name: 'Test',
          email: 'existing@example.com'
        })
      });

      const response = await put({ request, params: { id: '1' } } as any);
      expect(response.status).toBe(409);
    });
  });

  describe('DELETE handler', () => {
    it('should delete an author', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce({ id: '1' });
      vi.mocked(deleteEntry).mockResolvedValueOnce(true);

      const response = await del({ params: { id: '1' } } as any);
      expect(response.status).toBe(200);
    });

    it('should prevent deletion of last admin author', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce({ id: '1', role: 'admin' });
      vi.mocked(getCollection).mockResolvedValueOnce([{ id: '1', role: 'admin' }]);

      const response = await del({ params: { id: '1' } } as any);
      expect(response.status).toBe(403);
    });

    it('should handle deletion of non-existent author', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce(null);

      const response = await del({ params: { id: 'nonexistent' } } as any);
      expect(response.status).toBe(404);
    });
  });
});
