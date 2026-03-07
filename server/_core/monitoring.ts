/**
 * Monitoring & Logging System
 * Tracks application health, performance, and errors
 */

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  metadata?: Record<string, any>;
  error?: Error;
}

interface PerformanceMetric {
  operation: string;
  duration: number; // milliseconds
  timestamp: Date;
  success: boolean;
  error?: string;
}

class MonitoringService {
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private maxLogs = 10000;
  private maxMetrics = 5000;

  /**
   * Log message
   */
  log(
    level: 'info' | 'warn' | 'error' | 'debug',
    service: string,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      service,
      message,
      metadata,
      error,
    };

    this.logs.push(entry);

    // Keep log size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${service}]`;
    const logFn = level === 'error' ? console.error : console.log;
    logFn(`${prefix} ${message}`, metadata || '', error || '');
  }

  /**
   * Record performance metric
   */
  recordMetric(
    operation: string,
    duration: number,
    success: boolean = true,
    error?: string
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      error,
    };

    this.metrics.push(metric);

    // Keep metrics size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (duration > 1000) {
      this.log('warn', 'Performance', `Slow operation: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getMetricsStats(): {
    totalOperations: number;
    successRate: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    byOperation: Record<string, { count: number; avgDuration: number; errorRate: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        successRate: 0,
        averageDuration: 0,
        slowestOperation: null,
        byOperation: {},
      };
    }

    const totalOps = this.metrics.length;
    const successOps = this.metrics.filter(m => m.success).length;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalDuration / totalOps;
    const slowest = this.metrics.reduce((max, m) => 
      m.duration > (max?.duration || 0) ? m : max
    );

    const byOp: Record<string, { count: number; avgDuration: number; errorRate: number }> = {};
    
    this.metrics.forEach(m => {
      if (!byOp[m.operation]) {
        byOp[m.operation] = { count: 0, avgDuration: 0, errorRate: 0 };
      }
      byOp[m.operation].count++;
      byOp[m.operation].avgDuration += m.duration;
      if (!m.success) {
        byOp[m.operation].errorRate++;
      }
    });

    // Finalize calculations
    Object.values(byOp).forEach(stat => {
      stat.avgDuration = stat.avgDuration / stat.count;
      stat.errorRate = (stat.errorRate / stat.count) * 100;
    });

    return {
      totalOperations: totalOps,
      successRate: (successOps / totalOps) * 100,
      averageDuration: avgDuration,
      slowestOperation: slowest,
      byOperation: byOp,
    };
  }

  /**
   * Get recent logs
   */
  getLogs(limit: number = 100, level?: string): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }
    return filtered.slice(-limit);
  }

  /**
   * Get error logs
   */
  getErrors(limit: number = 100): LogEntry[] {
    return this.getLogs(limit, 'error');
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
    recentErrors: number;
  } {
    const stats = this.getMetricsStats();
    const errorRate = 100 - stats.successRate;
    const recentErrors = this.logs.filter(
      l => l.level === 'error' && 
      Date.now() - l.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorRate > 10 || recentErrors > 5) {
      status = 'unhealthy';
    } else if (errorRate > 5 || recentErrors > 2) {
      status = 'degraded';
    }

    return {
      status,
      uptime: process.uptime(),
      errorRate,
      avgResponseTime: stats.averageDuration,
      recentErrors,
    };
  }

  /**
   * Clear old logs and metrics
   */
  cleanup(olderThanMinutes: number = 60): void {
    const cutoff = Date.now() - (olderThanMinutes * 60 * 1000);
    
    this.logs = this.logs.filter(l => l.timestamp.getTime() > cutoff);
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  /**
   * Export logs for analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // CSV format
    const headers = ['Timestamp', 'Level', 'Service', 'Message'];
    const rows = this.logs.map(l => [
      l.timestamp.toISOString(),
      l.level,
      l.service,
      l.message,
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

// Export singleton
export const monitoring = new MonitoringService();

/**
 * Timing decorator for functions
 */
export function timed(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        monitoring.recordMetric(operation, duration, true);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        monitoring.recordMetric(operation, duration, false, (error as Error).message);
        throw error;
      }
    };

    return descriptor;
  };
}
