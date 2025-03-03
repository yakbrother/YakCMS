import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '../src/test/mocks/server';

// Enable request debugging
process.env.DEBUG = 'msw:*';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
