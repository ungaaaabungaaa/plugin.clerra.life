import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    emptyOutDir: false,
    sourcemap: true,
    target: 'es2022'
  }
});
