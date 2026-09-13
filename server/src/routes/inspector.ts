import { Router, Request, Response } from 'express';
import { telemetryStore } from '../ai/telemetryRecorder';
import { developerSettings } from '../ai/developerSettings';
import { getAvailableModels } from '../ai/modelRegistry';

export const inspectorRouter = Router();

// GET /api/inspector/traces - List latest pipeline execution traces
inspectorRouter.get('/traces', (_req: Request, res: Response): void => {
  const traces = telemetryStore.getLatestTraces(30);
  res.json({
    success: true,
    count: traces.length,
    traces,
  });
});

// GET /api/inspector/traces/:traceId - Get detailed trace execution tree
inspectorRouter.get('/traces/:traceId', (req: Request, res: Response): void => {
  const traceId = String(req.params.traceId);
  const trace = telemetryStore.getTrace(traceId);

  if (!trace) {
    res.status(404).json({
      error: `Trace ID "${traceId}" not found.`,
      code: 'TRACE_NOT_FOUND',
    });
    return;
  }

  res.json({
    success: true,
    trace,
  });
});

// GET /api/inspector/config - Get current Developer Settings & Model Registry
inspectorRouter.get('/config', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    config: developerSettings.getConfig(),
    availableModels: getAvailableModels(),
  });
});

// POST /api/inspector/config - Update Developer Settings (AI Mode, Model Toggles, Strong Model Budget)
inspectorRouter.post('/config', (req: Request, res: Response): void => {
  const updates = req.body || {};
  const newConfig = developerSettings.updateConfig(updates);
  res.json({
    success: true,
    config: newConfig,
    availableModels: getAvailableModels(),
  });
});

