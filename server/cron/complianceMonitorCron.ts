import { runComplianceMonitor } from '../services/complianceMonitorService';

const INTERVAL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export function startComplianceMonitorCron() {
  console.log('[ComplianceMonitor] Cron started — interval: 5 days');

  const run = async () => {
    console.log('[ComplianceMonitor] Running scheduled check...');
    try {
      const results = await runComplianceMonitor();
      console.log('[ComplianceMonitor] Complete:', results);
    } catch (err) {
      console.error('[ComplianceMonitor] Failed:', err);
    }
  };

  run();
  setInterval(run, INTERVAL_MS);
}
