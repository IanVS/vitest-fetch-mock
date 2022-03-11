import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'vitest-fetch-mock': './src/index',
    },
  },
  test: {
    setupFiles: ['./setupVitest.ts'],
  },
});
