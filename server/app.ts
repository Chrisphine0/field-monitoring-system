import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import fieldRoutes from './routes/fields.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health Check — no DB needed
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── DB init guard ──────────────────────────────────────────────────────────────
// Must be registered BEFORE the routes below so every /api request
// waits for the database to be ready on the first cold start.
let dbReady = false;
let dbInitPromise: Promise<void> | null = null;

function ensureDb(): Promise<void> {
  if (dbReady) return Promise.resolve();
  if (!dbInitPromise) {
    dbInitPromise = initDb()
      .then(() => { dbReady = true; })
      .catch(err => {
        dbInitPromise = null; // allow retry on next request
        throw err;
      });
  }
  return dbInitPromise;
}

app.use('/api', async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err: any) {
    console.error('DB init failed:', err);
    res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }
});

// ── API Routes (registered AFTER the DB guard) ─────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

export default app;