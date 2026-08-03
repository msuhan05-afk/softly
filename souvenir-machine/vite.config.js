import { defineConfig } from 'vite';

export default defineConfig({
  // This subproject has no PostCSS/Tailwind setup of its own; without an
  // explicit (empty) config here, Vite walks up and picks up the sibling
  // Buzzora app's postcss.config.mjs, which fails to resolve.
  css: {
    postcss: {},
  },
});
