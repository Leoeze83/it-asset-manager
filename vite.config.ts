import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('/firebase/auth/') || id.includes('/@firebase/auth/')) {
              return 'vendor-firebase-auth';
            }

            if (id.includes('/firebase/firestore/') || id.includes('/@firebase/firestore/')) {
              return 'vendor-firebase-firestore';
            }

            if (id.includes('/firebase/app/') || id.includes('/@firebase/app/')) {
              return 'vendor-firebase-core';
            }

            if (id.includes('/firebase/') || id.includes('/@firebase/')) {
              return 'vendor-firebase-misc';
            }

            if (id.includes('/recharts/')) {
              return 'vendor-recharts';
            }

            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }

            if (id.includes('/date-fns/')) {
              return 'vendor-date-fns';
            }

            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }

            return 'vendor-misc';
          },
        },
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
