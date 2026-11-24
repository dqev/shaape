import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://shaape.co',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('shapes.ts')) {
              return 'shapes-data';
            }
          },
        },
      },
    },
  },
});
