import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { devAuthMiddleware } from './api/_lib/devMiddleware.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables (including .env.local) into process.env for serverless handlers
  const env = loadEnv(mode, process.cwd(), '');
  process.env.DOSTFLIX_ACCESS_PASSWORD = env.DOSTFLIX_ACCESS_PASSWORD || process.env.DOSTFLIX_ACCESS_PASSWORD || 'accesstoourchaos';
  process.env.DOSTFLIX_SESSION_SECRET = env.DOSTFLIX_SESSION_SECRET || process.env.DOSTFLIX_SESSION_SECRET || 'dostflix_private_session_secret_2026_inner_circle';

  return {
    plugins: [
      react(),
      {
        name: 'inner-circle-dev-server',
        configureServer(server) {
          server.middlewares.use(devAuthMiddleware());
        }
      }
    ],
    optimizeDeps: {
      include: ['heic-decode']
    },
    server: {
      port: 3000,
      open: true
    }
  };
});
