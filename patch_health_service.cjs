const fs = require('fs');
let content = fs.readFileSync('src/services/systemHealthService.ts', 'utf8');

// Replace imports
content = content.replace(/import \{ db, auth \} from '\.\.\/lib\/firebase';/g, 'import { auth } from \'../lib/firebase\';');
content = content.replace(/import \{ doc, getDocFromServer, setDoc, serverTimestamp \} from '@\/src\/lib\/firebase';/g, '');

// Replace PostgreSQL probe
const newPgProbe = `
  // 1. Probe PostgreSQL DB
  private async probePostgreSQL(): Promise<ServiceHealthCheck> {
    const id = 'postgresql_db';
    const start = performance.now();
    try {
      // Test server-side read ping to PostgreSQL
      const res = await fetch('/api/schools?limit=1', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Database unreachable');

      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, true);

      return {
        id,
        name: 'قاعدة البيانات المركزية (PostgreSQL)',
        category: 'database',
        status: 'healthy',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: null,
        details: { connection: 'active', dialect: 'pg' }
      };
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, false);
      return {
        id,
        name: 'قاعدة البيانات المركزية (PostgreSQL)',
        category: 'database',
        status: 'critical',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: error.message || 'فشل الاتصال بقاعدة البيانات',
        details: { error: String(error) }
      };
    }
  }
`;

content = content.replace(/\/\/ 1\. Probe PostgreSQL DB[\s\S]*?\} catch \(error: any\) \{[\s\S]*?details: \{ error: String\(error\) \}\n      \};\n    \}\n  \}/g, newPgProbe.trim());

// Also update the `reconnectAndPingService` for PG if it uses firebase
const pgReconnect = `
      if (serviceId === 'postgresql_db') {
        await fetch('/api/schools?limit=1', { signal: AbortSignal.timeout(5000) });
        await this.probePostgreSQL();
        const latency = Math.round(performance.now() - start);
        return { success: true, message: \`تم فحص وإعادة الاتصال بقاعدة بيانات PostgreSQL بنجاح (\${latency}ms)\`, latencyMs: latency };
      }
`;

content = content.replace(/if \(serviceId === 'postgresql_db'\) \{[\s\S]*?latencyMs: latency \};\n      \}/, pgReconnect.trim());

fs.writeFileSync('src/services/systemHealthService.ts', content);
