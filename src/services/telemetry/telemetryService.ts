import { API_BASE_URL } from '../../lib/apiClient';
import { PipelineTrace } from '../../types/telemetry';

export class TelemetryService {
  async getTraces(): Promise<PipelineTrace[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/traces`);
      if (res.ok) {
        const data = await res.json();
        return data.traces || [];
      }
    } catch (e) {
      console.warn('[TelemetryService] Error fetching traces:', e);
    }
    return [];
  }

  async getTraceById(traceId: string): Promise<PipelineTrace | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/traces/${traceId}`);
      if (res.ok) {
        const data = await res.json();
        return data.trace || null;
      }
    } catch (e) {
      console.warn(`[TelemetryService] Error fetching trace ${traceId}:`, e);
    }
    return null;
  }

  async getConfig(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/config`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[TelemetryService] Error fetching config:', e);
    }
    return null;
  }

  async updateConfig(updates: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[TelemetryService] Error updating config:', e);
    }
    return null;
  }
}

export const telemetryService = new TelemetryService();
