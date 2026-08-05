import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // Avoid inheriting the sibling Buzzora app's postcss.config.mjs, same
  // issue as souvenir-machine/vite.config.js.
  css: {
    postcss: {},
  },
  build: {
    rollupOptions: {
      // Vite only bundles index.html by default — recognize.html needs to
      // be listed explicitly as a second entry point or `vite build`
      // won't include it in dist/.
      input: {
        main: resolve(__dirname, 'index.html'),
        recognize: resolve(__dirname, 'recognize.html'),
      },
    },
  },
  server: {
    // In dev, `npm run dev:api` runs the same API logic Vercel runs in
    // production (see dev-api-server.js) on a separate port; Vite proxies
    // /api requests to it so the frontend can call a single origin.
    proxy: {
      '/api': 'http://localhost:5175',
    },
  },
});
