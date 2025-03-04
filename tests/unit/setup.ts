import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import 'cross-fetch/polyfill';

// Base URL for all API requests in tests
export const BASE_URL = 'http://localhost:3000';

// Initialize MSW
export const server = setupServer(
  // Add default handlers here
  http.all('*', ({ request }) => {
    console.warn(`Request ${request.method} ${request.url} was not mocked`);
    return new HttpResponse(JSON.stringify({ error: 'Not Mocked' }), { status: 404 });
  })
);

beforeAll(() => {
  console.log('Starting MSW server');
  server.listen({ 
    onUnhandledRequest: (req, print) => {
      console.error(`Unhandled ${req.method} request to ${req.url}`);
      print.error();
    }
  });
});
afterAll(() => {
  console.log('Stopping MSW server');
  server.close();
});
afterEach(() => {
  console.log('Resetting MSW handlers');
  server.resetHandlers();
});
