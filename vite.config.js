import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'process': resolve(__dirname, 'node_modules/process/browser.js'),
      'stream': resolve(__dirname, 'node_modules/stream-browserify'),
      'util': resolve(__dirname, 'node_modules/util'),
      'buffer': resolve(__dirname, 'node_modules/buffer')
    }
  },
  define: {
    'process.env': {},
    'global': {},
    'Buffer': ['buffer', 'Buffer']
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    },
    include: [
      '@project-serum/serum',
      '@solana/web3.js',
      'buffer',
      'eventemitter3'
    ]
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});