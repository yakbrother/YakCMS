import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import db from '@astrojs/db';

export default defineConfig({
  output: 'server',
  integrations: [db()],
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    }
  }
});
