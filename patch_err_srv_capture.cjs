const fs = require('fs');
let content = fs.readFileSync('src/services/errorMonitoringService.ts', 'utf8');

const captureBlock = `
  public async captureError(params: {
    service: ErrorService;
    module?: string;
    screen?: string;
    action?: string;
    errorCode?: string;
    errorMessage: string;
    stackTrace?: string;
    severity?: ErrorSeverity;
    userId?: string | null;
    schoolId?: string | null;
    contextData?: any;
  }) {
    try {
      const signature = \`\${params.service}-\${params.module || 'unknown'}-\${params.errorCode || 'none'}\`.replace(/[^a-zA-Z0-9-]/g, '_');
      const docId = \`err_\${Date.now()}_\${Math.floor(Math.random() * 1000)}\`;

      const errObj: SystemErrorItem = {
        errorId: docId,
        signature,
        service: params.service,
        module: params.module || 'unknown',
        screen: params.screen,
        action: params.action,
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        stackTrace: params.stackTrace,
        severity: params.severity || 'medium',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        userId: params.userId || auth.currentUser?.uid,
        schoolId: params.schoolId,
        contextData: params.contextData,
        browserInfo: navigator.userAgent
      };

      await fetch('/api/system_errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, ...errObj })
      });
      // no need to store in local memory as we fetch it
    } catch (e) {
      // failed to log
    }
  }
`;

content = content.replace(/public async captureError\([\s\S]*?\}\n  \}/g, captureBlock);

fs.writeFileSync('src/services/errorMonitoringService.ts', content);
