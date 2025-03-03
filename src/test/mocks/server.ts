import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configure MSW with performance optimizations
export const server = setupServer(...handlers);

// Reduce network delay simulation
server.listen({ onUnhandledRequest: 'bypass' });

// Disable response transforms
server.events.on('request:start', () => {
  return {
    shouldContinue: true,
    willCompose: false,
  };
});
