import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configure MSW with performance optimizations
export const server = setupServer(...handlers);

// Disable response transforms for better performance
server.events.on('request:start', () => {
  return {
    shouldContinue: true,
    willCompose: false,
  };
});
