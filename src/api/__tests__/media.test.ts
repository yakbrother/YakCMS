import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, post, del } from '../media';
import { getCollection, getEntry, deleteEntry } from 'astro:content';
import { processImage, getImageMetadata } from '../utils/image-processor';

vi.mock('astro:content', () => ({
  getCollection: vi.fn(),
  getEntry: vi.fn(),
  deleteEntry: vi.fn()
}));

vi.mock('../utils/image-processor', () => ({
  processImage: vi.fn(),
  getImageMetadata: vi.fn()
}));

describe('Media API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET handler', () => {
    it('should return all media items', async () => {
      const mockMedia = [
        { id: '1', filename: 'test1.jpg', type: 'image/jpeg', size: 1024 },
        { id: '2', filename: 'test2.png', type: 'image/png', size: 2048 }
      ];

      vi.mocked(getCollection).mockResolvedValueOnce(mockMedia);

      const response = await get({ params: {} } as any);
      const data = await response.json();

      expect(data).toEqual(mockMedia);
      expect(response.status).toBe(200);
    });

    it('should filter media by type', async () => {
      const mockMedia = [
        { id: '1', filename: 'test1.jpg', type: 'image/jpeg' },
        { id: '2', filename: 'test.pdf', type: 'application/pdf' }
      ];

      vi.mocked(getCollection).mockResolvedValueOnce(mockMedia);

      const response = await get({ params: { type: 'image' } } as any);
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].type).toContain('image');
    });

    it('should return media item details', async () => {
      const mockMedia = {
        id: '1',
        filename: 'test.jpg',
        type: 'image/jpeg',
        metadata: {
          width: 1920,
          height: 1080,
          format: 'jpeg'
        }
      };

      vi.mocked(getEntry).mockResolvedValueOnce(mockMedia);

      const response = await get({ params: { id: '1' } } as any);
      const data = await response.json();

      expect(data).toEqual(mockMedia);
      expect(response.status).toBe(200);
    });
  });

  describe('POST handler', () => {
    it('should upload and process new image', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', mockFile);

      const request = new Request('http://localhost/api/media', {
        method: 'POST',
        body: formData
      });

      vi.mocked(processImage).mockResolvedValueOnce({
        filename: 'test.jpg',
        path: '/uploads/test.jpg',
        thumbnailPath: '/uploads/thumbnails/test.jpg'
      });

      vi.mocked(getImageMetadata).mockResolvedValueOnce({
        width: 1920,
        height: 1080,
        format: 'jpeg'
      });

      const response = await post({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('path');
      expect(data).toHaveProperty('thumbnailPath');
      expect(data.metadata).toHaveProperty('width');
    });

    it('should validate file type', async () => {
      const mockFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      const formData = new FormData();
      formData.append('file', mockFile);

      const request = new Request('http://localhost/api/media', {
        method: 'POST',
        body: formData
      });

      const response = await post({ request } as any);
      expect(response.status).toBe(400);
    });

    it('should handle large file uploads', async () => {
      const mockFile = new File(['test'.repeat(1000000)], 'large.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', mockFile);

      const request = new Request('http://localhost/api/media', {
        method: 'POST',
        body: formData
      });

      const response = await post({ request } as any);
      expect(response.status).toBe(413);
    });

    it('should generate optimized versions', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('generateSizes', 'true');

      const request = new Request('http://localhost/api/media', {
        method: 'POST',
        body: formData
      });

      vi.mocked(processImage).mockResolvedValueOnce({
        filename: 'test.jpg',
        path: '/uploads/test.jpg',
        thumbnailPath: '/uploads/thumbnails/test.jpg',
        sizes: {
          small: '/uploads/test-300w.jpg',
          medium: '/uploads/test-800w.jpg',
          large: '/uploads/test-1200w.jpg'
        }
      });

      const response = await post({ request } as any);
      const data = await response.json();

      expect(data).toHaveProperty('sizes');
      expect(Object.keys(data.sizes)).toHaveLength(3);
    });
  });

  describe('DELETE handler', () => {
    it('should delete media item and associated files', async () => {
      const mockMedia = {
        id: '1',
        filename: 'test.jpg',
        path: '/uploads/test.jpg',
        thumbnailPath: '/uploads/thumbnails/test.jpg',
        sizes: {
          small: '/uploads/test-300w.jpg',
          medium: '/uploads/test-800w.jpg'
        }
      };

      vi.mocked(getEntry).mockResolvedValueOnce(mockMedia);
      vi.mocked(deleteEntry).mockResolvedValueOnce(true);

      const response = await del({ params: { id: '1' } } as any);
      expect(response.status).toBe(200);
    });

    it('should handle deletion of non-existent media', async () => {
      vi.mocked(getEntry).mockResolvedValueOnce(null);

      const response = await del({ params: { id: 'nonexistent' } } as any);
      expect(response.status).toBe(404);
    });

    it('should prevent deletion of in-use media', async () => {
      const mockMedia = { id: '1', filename: 'test.jpg' };
      const mockPosts = [
        { id: 'post1', content: 'Uses /uploads/test.jpg' }
      ];

      vi.mocked(getEntry).mockResolvedValueOnce(mockMedia);
      vi.mocked(getCollection).mockResolvedValueOnce(mockPosts);

      const response = await del({ params: { id: '1' } } as any);
      expect(response.status).toBe(409);
    });
  });
});
