import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/VizualizaceDatovychStruktur/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        linkedlist: resolve(__dirname, 'pages/linkedlist.html'),
        stack:      resolve(__dirname, 'pages/stack.html'),
        queue:      resolve(__dirname, 'pages/queue.html'),
        array:      resolve(__dirname, 'pages/array.html'),
        BST:        resolve(__dirname, 'pages/BST.html'),
      },
    },
  },
}));
