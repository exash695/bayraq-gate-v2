export interface AnalyticsLog {
  endpoint: string;
  model: string;
  isCacheHit: boolean;
  processingTimeMs: number;
  metadata?: any;
  timestamp: string;
}

const memoryLogs: AnalyticsLog[] = [];

export class AnalyticsManager {
  static async logUsage(params: {
    endpoint: string;
    model: string;
    isCacheHit: boolean;
    processingTimeMs: number;
    metadata?: any;
  }) {
    try {
      const logData: AnalyticsLog = {
        ...params,
        timestamp: new Date().toISOString()
      };
      
      console.log("[Analytics]", JSON.stringify(logData));

      memoryLogs.push(logData);
      if (memoryLogs.length > 2000) {
        memoryLogs.shift();
      }
    } catch (error) {
      console.error("Analytics logging error:", error);
    }
  }

  static getLogs(): AnalyticsLog[] {
    return memoryLogs;
  }
}

