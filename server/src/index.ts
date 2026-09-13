import express from 'express';
import cors from 'cors';
import { config } from './config';
import { aiRouter } from './routes/ai';
import { youtubeRouter } from './routes/youtube';
import { inspectorRouter } from './routes/inspector';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nyaya-flow-server',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(config.geminiApiKey),
    youtubeConfigured: Boolean(config.youtubeApiKey),
  });
});

// Routes
app.use('/api/ai', aiRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/inspector', inspectorRouter);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n🏛️  Nyaya Flow API Server running on http://0.0.0.0:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
  console.log(`   Inspector: http://localhost:${config.port}/api/inspector/traces`);
  console.log(`   Gemini: ${config.geminiApiKey ? '✅ configured' : '❌ missing GEMINI_API_KEY'}`);
  console.log(`   YouTube: ${config.youtubeApiKey ? '✅ configured' : '⚠️  missing YOUTUBE_API_KEY (will use curated fallback)'}`);
  console.log('');
});
