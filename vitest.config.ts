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
