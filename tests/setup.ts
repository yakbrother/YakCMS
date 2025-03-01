import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';

// Mock handlers for API endpoints
const handlers = [
  http.get('/api/posts', () => {
    return HttpResponse.json({
      posts: [
        {
          id: '1',
          title: 'Test Post',
          content: 'Test content',
          publishDate: '2025-03-01T12:00:00Z'
        }
      ]
    });
  }),
  
  http.post('/api/posts', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      success: true,
      post: {
        id: '2',
        ...data
      }
    });
  }),

  http.get('/api/media', () => {
    return HttpResponse.json({
      media: [
        {
          id: '1',
          url: '/assets/posts/test-image.webp',
          alt: 'Test image'
        }
      ]
    });
  }),

  http.post('/api/media/upload', async ({ request }) => {
    const formData = await request.formData();
    return HttpResponse.json({
      success: true,
      file: {
        id: '2',
        url: '/assets/posts/uploaded-image.webp'
      }
    });
  })
];

const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
