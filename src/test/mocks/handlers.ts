import { http, HttpResponse } from 'msw';

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

const mockMedia = {
  id: '1',
  filename: 'test.jpg',
  path: '/uploads/test.jpg',
  mimetype: 'image/jpeg',
  size: 1024,
  createdAt: '2025-03-03T08:20:08.000Z',
  metadata: {
    width: 800,
    height: 600,
    alt: 'Test image'
  }
};

const mockAuditEntry = {
  id: '1',
  action: 'post.create',
  userId: 'user-1',
  resourceType: 'post',
  resourceId: 'post-1',
  metadata: {
    title: 'New Post',
    changes: {
      status: ['draft', 'published']
    }
  },
  timestamp: '2025-03-03T08:20:08.000Z',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0'
};

const mockBackup = {
  id: '1',
  type: 'full',
  status: 'completed',
  size: 1024000,
  path: '/backups/2025-03-03-full.zip',
  createdAt: '2025-03-03T08:20:08.000Z',
  completedAt: '2025-03-03T08:21:08.000Z',
  metadata: {
    posts: 100,
    media: 50,
    users: 10
  }
};

export const handlers = [
  // Backup Management
  http.post('/api/backups', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: '1',
      type: body.type || 'full',
      status: 'in_progress',
      createdAt: '2025-03-03T08:20:08.000Z',
      completedAt: null
    });
  }),

  http.get('/api/backups', () => {
    return HttpResponse.json({
      backups: [mockBackup],
      total: 1
    });
  }),

  http.get('/api/backups/:id', () => {
    return HttpResponse.json(mockBackup);
  }),

  http.post('/api/backups/:id/restore', () => {
    return HttpResponse.json({
      jobId: 'restore-1',
      status: 'in_progress',
      startedAt: '2025-03-03T08:20:08.000Z'
    });
  }),
  // Posts
  http.get('/api/posts', () => {
    return HttpResponse.json({
      posts: [mockPost],
      total: 1,
      page: 1,
      pageSize: 10
    });
  }),

  http.post('/api/posts', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockPost, ...body });
  }),

  http.put('/api/posts/:id', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockPost, ...body });
  }),

  http.post('/api/posts/:id/versions', () => {
    return HttpResponse.json({
      id: '1-v2',
      postId: '1',
      version: 2,
      content: '# Previous Content',
      createdAt: '2025-03-03T08:10:08.000Z'
    });
  }),
  
  // Authors
  http.get('/api/authors', () => {
    return HttpResponse.json({
      authors: [],
      total: 0
    });
  }),

  // Media
  http.get('/api/media', () => {
    return HttpResponse.json({
      media: [mockMedia],
      total: 1
    });
  }),

  http.post('/api/media', async () => {
    return HttpResponse.json(mockMedia);
  }),

  http.put('/api/media/:id', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockMedia, ...body });
  }),

  // Authentication
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ token: 'mock-jwt-token' });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.post('/api/auth/reset-password', () => {
    return HttpResponse.json({ success: true });
  }),

  http.put('/api/auth/reset-password', async ({ request }) => {
    const body = await request.json();
    if (body.token === 'expired-token') {
      return new HttpResponse(
        JSON.stringify({ error: 'Token expired' }),
        { status: 400 }
      );
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/verify-email', () => {
    return HttpResponse.json({ success: true });
  }),

  http.put('/api/auth/verify-email', async ({ request }) => {
    const body = await request.json();
    if (body.token === 'invalid-token') {
      return new HttpResponse(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 400 }
      );
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/2fa/setup', () => {
    return HttpResponse.json({
      secret: 'ABCDEFGHIJKLMNOP',
      qrCode: 'data:image/png;base64,mockQrCode'
    });
  }),

  http.post('/api/auth/2fa/verify', async ({ request }) => {
    const body = await request.json();
    if (body.token === 'invalid') {
      return new HttpResponse(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 400 }
      );
    }
    return HttpResponse.json({ success: true });
  })
];
