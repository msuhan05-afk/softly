import { defineConfig } from 'vite';

export default defineConfig({
  // Avoid inheriting the sibling Buzzora app's postcss.config.mjs, same
  // issue as souvenir-machine/vite.config.js.
  css: {
    postcss: {},
  },
  server: {
    // In dev, `npm run dev:api` runs the same generate-image logic Vercel
    // runs in production (see dev-api-server.js) on a separate port; Vite
    // proxies /api requests to it so the frontend can call a single origin.
    proxy: {
      '/api': 'http://localhost:5175',
    },
  },
});
