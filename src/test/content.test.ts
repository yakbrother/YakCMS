import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from './mocks/server';
import { rest } from 'msw';

describe('Content Management System', () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-03T08:20:08.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Posts', () => {
    const mockPost = {
      id: '1',
      title: 'Test Post',
      slug: 'test-post',
      content: '# Test Content',
      author: 'default',
      status: 'draft',
      createdAt: '2025-03-03T08:20:08.000Z',
      updatedAt: '2025-03-03T08:20:08.000Z',
      metadata: {
        description: 'Test description',
        keywords: ['test', 'content']
      }
    };

    it('should validate required fields when creating a post', async () => {
      server.use(
        rest.post('/api/posts', async (req, res, ctx) => {
          const body = await req.json();
          if (!body.title) {
            return new HttpResponse(
              JSON.stringify({ error: 'Title is required' }),
              { status: 400 }
            );
          }
          return res(ctx.json({ ...mockPost, ...body }));
        })
      );

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '# Test Content'
        })
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBe('Title is required');
    });

    it('should create a new post with all fields', async () => {
      server.use(
        rest.post('/api/posts', async (req, res, ctx) => {
          const body = await req.json();
          return res(ctx.json({ ...mockPost, ...body }));
        })
      );

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Post',
          content: '# Test Content'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.title).toBe('Test Post');
      expect(data.content).toBe('# Test Content');
      expect(data.status).toBe('draft');
    });

    it('should handle concurrent post updates', async () => {
      let version = 1;
      server.use(
        rest.put('/api/posts/1', async (req, res, ctx) => {
          const body = await req.json();
          if (body.version !== version) {
            return new HttpResponse(
              JSON.stringify({ error: 'Conflict: Post was modified' }),
              { status: 409 }
            );
          }
          version++;
          return res(ctx.json({ ...mockPost, ...body, version }));
        })
      );

      // First update
      const response1 = await fetch('/api/posts/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Post 1',
          version: 1
        })
      });
      expect(response1.ok).toBe(true);

      // Second concurrent update with old version
      const response2 = await fetch('/api/posts/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Post 2',
          version: 1
        })
      });
      expect(response2.ok).toBe(false);
      expect(response2.status).toBe(409);
    });

    it('should update an existing post with validation', async () => {
      server.use(
        rest.put('/api/posts/1', async (req, res, ctx) => {
          const body = await req.json();
          return res(ctx.json({ ...mockPost, ...body }));
        })
      );

      const response = await fetch('/api/posts/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Post',
          content: '# Updated Content'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.title).toBe('Updated Post');
      expect(data.content).toBe('# Updated Content');
    });

    it('should handle post versioning', async () => {
      server.use(
        rest.post('/api/posts/1/versions', async (req, res, ctx) => {
          return res(ctx.json({
            id: '1-v2',
            postId: '1',
            version: 2,
            content: '# Previous Content',
            createdAt: '2025-03-03T08:10:08.000Z'
          }));
        })
      );

      const response = await fetch('/api/posts/1/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.version).toBe(2);
      expect(data.postId).toBe('1');
    });
  });

  });

  describe('Media Library', () => {
    const mockMedia = {
      id: '1',
      filename: 'icon.png', // Small icon file
      path: '/uploads/icon.png',
      size: 1024, // 1KB file
      mimetype: 'image/jpeg',
      size: 1024,
      createdAt: '2025-03-03T08:20:08.000Z',
      metadata: {
        width: 800,
        height: 600,
        alt: 'Test image'
      }
    };

    it('should validate file size and type restrictions', async () => {
      server.use(
        rest.post('/api/media', async (req, res, ctx) => {
          const formData = await req.formData();
          const file = formData.get('file');
          
          if (file.size > 5 * 1024 * 1024) {
            return new HttpResponse(
              JSON.stringify({ error: 'File size exceeds 5MB limit' }),
              { status: 400 }
            );
          }

          if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            return new HttpResponse(
              JSON.stringify({ error: 'Invalid file type' }),
              { status: 400 }
            );
          }

          return res(ctx.json(mockMedia));
        })
      );

      // Test file size limit
      const largeFile = new Blob([new ArrayBuffer(6 * 1024 * 1024)], { type: 'image/jpeg' });
      const formData1 = new FormData();
      formData1.append('file', largeFile, 'large.jpg');

      const response1 = await fetch('/api/media', {
        method: 'POST',
        body: formData1
      });

      expect(response1.ok).toBe(false);
      const data1 = await response1.json();
      expect(data1.error).toBe('File size exceeds 5MB limit');

      // Test invalid file type
      const invalidFile = new Blob(['test'], { type: 'text/plain' });
      const formData2 = new FormData();
      formData2.append('file', invalidFile, 'test.txt');

      const response2 = await fetch('/api/media', {
        method: 'POST',
        body: formData2
      });

      expect(response2.ok).toBe(false);
      const data2 = await response2.json();
      expect(data2.error).toBe('Invalid file type');
    });

    it('should upload a new media file with proper metadata', async () => {
      server.use(
        rest.post('/api/media', async (req, res, ctx) => {
          return res(ctx.json(mockMedia));
        })
      );

      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.filename).toBe('test.jpg');
      expect(data.mimetype).toBe('image/jpeg');
    });

    it('should handle bulk media operations', async () => {
      server.use(
        rest.post('/api/media/bulk/delete', async (req, res, ctx) => {
          const body = await req.json();
          return res(ctx.json({
            success: true,
            deleted: body.ids.length,
            failed: []
          }));
        }),

        rest.post('/api/media/bulk/tag', async (req, res, ctx) => {
          const body = await req.json();
          return res(ctx.json({
            success: true,
            updated: body.ids.length,
            tags: body.tags
          }));
        })
      );

      // Test bulk delete
      const deleteResponse = await fetch('/api/media/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: ['1', '2', '3']
        })
      });

      expect(deleteResponse.ok).toBe(true);
      const deleteData = await deleteResponse.json();
      expect(deleteData.deleted).toBe(3);

      // Test bulk tagging
      const tagResponse = await fetch('/api/media/bulk/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: ['4', '5'],
          tags: ['featured', 'homepage']
        })
      });

      expect(tagResponse.ok).toBe(true);
      const tagData = await tagResponse.json();
      expect(tagData.updated).toBe(2);
      expect(tagData.tags).toEqual(['featured', 'homepage']);
    });

    it('should update media metadata', async () => {
      server.use(
        rest.put('/api/media/1', async (req, res, ctx) => {
          const body = await req.json();
          return res(ctx.json({ ...mockMedia, ...body }));
        })
      );

      const response = await fetch('/api/media/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            alt: 'Icon image',
            caption: 'Small icon'
          }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.metadata.alt).toBe('Icon image');
      expect(data.metadata.caption).toBe('Small icon');
          return res(ctx.json({ ...mockMedia, metadata: body.metadata }));
        })
      );

      const response = await fetch('/api/media/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            alt: 'Updated alt text',
            caption: 'New caption'
          }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.metadata.alt).toBe('Updated alt text');
      expect(data.metadata.caption).toBe('New caption');
    });
  });
});
