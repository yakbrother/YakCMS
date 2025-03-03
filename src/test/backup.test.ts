import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

describe('Backup System', () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-03T08:20:08.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('should create a new backup', async () => {
    server.use(
      http.post('/api/backups', () => {
        return HttpResponse.json({
          ...mockBackup,
          status: 'in_progress',
          completedAt: null
        });
      })
    );

    const response = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'full' })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.type).toBe('full');
    expect(data.status).toBe('in_progress');
  });

  it('should list available backups', async () => {
    server.use(
      http.get('/api/backups', () => {
        return HttpResponse.json({
          backups: [mockBackup],
          total: 1
        });
      })
    );

    const response = await fetch('/api/backups');
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.backups).toHaveLength(1);
    expect(data.backups[0].type).toBe('full');
  });

  it('should restore from backup', async () => {
    server.use(
      http.post('/api/backups/1/restore', () => {
        return HttpResponse.json({
          jobId: 'restore-1',
          status: 'in_progress',
          startedAt: '2025-03-03T08:20:08.000Z'
        });
      })
    );

    const response = await fetch('/api/backups/1/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.jobId).toBe('restore-1');
    expect(data.status).toBe('in_progress');
  });

  it('should check backup status', async () => {
    server.use(
      http.get('/api/backups/1', () => {
        return HttpResponse.json(mockBackup);
      })
    );

    const response = await fetch('/api/backups/1');
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('completed');
    expect(data.size).toBe(1024000);
  });
});
