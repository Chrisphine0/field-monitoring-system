import { createServer as createViteServer } from 'vite';
import app from './server/app.js';

const PORT = 3000;

async function startServer() {
  // Attach Vite HMR middleware for local development only
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});