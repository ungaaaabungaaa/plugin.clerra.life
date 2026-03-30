import tailwindcss from '@tailwindcss/vite';
import { build, mergeConfig } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const watch = process.argv.includes('--watch');

const baseConfig = {
  publicDir: 'public',
  plugins: [tailwindcss()],
  build: {
    emptyOutDir: false,
    sourcemap: true,
    target: 'es2022'
  }
};

const entrypoints = [
  { name: 'background', entry: path.join(root, 'src/background.ts') },
  { name: 'content', entry: path.join(root, 'src/content.ts') },
  { name: 'popup', entry: path.join(root, 'src/popup/main.ts') },
  { name: 'player', entry: path.join(root, 'src/player/main.ts') }
];

async function resetDist() {
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
  await fs.cp(path.join(root, 'public'), distDir, { recursive: true });
}

async function buildEntry({ entry, name }) {
  await build(
    mergeConfig(baseConfig, {
      logLevel: 'info',
      build: {
        watch: watch ? {} : null,
        emptyOutDir: false,
        outDir: distDir,
        lib: {
          entry,
          formats: ['iife'],
          name: `Clerra${name[0].toUpperCase()}${name.slice(1)}`,
          fileName: () => `${name}.js`,
          ...(name === 'popup' ? { cssFileName: 'popup' } : {})
        },
        rollupOptions: {
          output: {
            extend: true
          }
        }
      }
    })
  );
}

await resetDist();
await Promise.all(entrypoints.map(buildEntry));
