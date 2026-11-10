import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
              return 'firebase-firestore';
            }
            if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
              return 'firebase-auth';
            }
            if (
              id.includes('@firebase/app') ||
              id.includes('firebase/app') ||
              id.includes('@firebase/util') ||
              id.includes('@firebase/component') ||
              id.includes('@firebase/logger')
            ) {
              return 'firebase-app';
            }
          },
        },
      },
    },
  },
});
