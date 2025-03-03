/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { getViteConfig } from 'astro/config';

export default defineConfig({
  ...getViteConfig(),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    pool: 'forks', // Use process pool for better isolation
    poolOptions: {
      forks: {
        minForks: 2,
        maxForks: 4,
      },
    },
    testTimeout: 10000, // 10 second timeout
    hookTimeout: 10000,
    isolate: true, // Better test isolation
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        'tests/setup.ts',
        'src/env.d.ts',
      ],
    },
  },
});
