import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const serverConfig = {
    hmr: false,
    // Only include the proxy in development mode
    ...(mode !== 'production' && {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    }),
  };

  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'dist',
    },
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: serverConfig,
  };
});
