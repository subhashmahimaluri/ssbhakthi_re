import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'tests/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    silent: false,
    reporters: ['verbose'],
  },
  esbuild: {
    target: 'node18',
  },
});
