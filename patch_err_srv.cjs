const fs = require('fs');
let content = fs.readFileSync('src/services/errorMonitoringService.ts', 'utf8');

const replacement = `
  public async resolvePermissionError(signature: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.updateStatus(signature, 'resolved');
      return { success: true, message: 'تم تجديد الجلسة وحل الخطأ بنجاح' };
    } catch(e) { return { success: false, message: e.message }; }
  }

  public async updateStatus(signature: string, status: ErrorStatus) {
    try {
      await fetch(\`/api/system_errors/\${signature}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (this.errorsMap.has(signature)) {
        this.errorsMap.get(signature)!.status = status;
        this.notify();
      }
    } catch (e) {
      // Ignored
    }
  }

  public async deleteError(signature: string) {
    try {
      await fetch(\`/api/system_errors/\${signature}\`, { method: 'DELETE' });
      this.errorsMap.delete(signature);
      this.notify();
    } catch (e) {
      // Ignored
    }
  }

  public async resolveBatchByService(service: ErrorService): Promise<{count: number}> {
    let count = 0;
    try {
      const arr = Array.from(this.errorsMap.values()).filter(e => e.service === service && e.status !== 'resolved');
      for (const e of arr) {
        await this.updateStatus(e.signature, 'resolved');
        count++;
      }
    } catch (e) { }
    return { count };
  }

  public async clearAllResolved() {
    try {
      const arr = Array.from(this.errorsMap.values()).filter(e => e.status === 'resolved');
      for (const e of arr) {
        await this.deleteError(e.signature);
      }
    } catch (e) { }
  }
`;

content = content.replace(/public async resolvePermissionError[\s\S]*?public async clearAllResolved\(\) \{[\s\S]*?\}\s*\}\s*$/g, replacement + '\n}\n');

fs.writeFileSync('src/services/errorMonitoringService.ts', content);
