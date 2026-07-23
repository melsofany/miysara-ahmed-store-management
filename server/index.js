import express from 'express';
import cors from 'cors';
import { runMigrations } from './migrate.js';
import authRouter from './routes/auth.js';
import queryRouter from './routes/query.js';
import mutateRouter from './routes/mutate.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/query', queryRouter);
app.use('/api/mutate', mutateRouter);

// Fallback: serve index.html for any non-api route (SPA)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

if (existsSync(distDir)) {
  const { default: serveStatic } = await import('serve-static');
  app.use(serveStatic(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });
}

// Run DB migrations then start
runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
