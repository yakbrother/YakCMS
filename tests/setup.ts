import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http } from 'msw';

// Initialize MSW
export const server = setupServer(
  // Add default handlers here
  http.get('*', () => {
    return new Response('Not Mocked', { status: 404 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
