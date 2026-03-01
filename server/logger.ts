/**
 * Structured Logger
 * 
 * Pino-based structured logging for production observability
 * Provides audit trail, performance monitoring, and error tracking
 */

/**
 * Simple structured logger (pino not installed, using console with structure)
 * In production, replace with actual pino logger
 */
export class StructuredLogger {
  private context: string;
  private level: 'debug' | 'info' | 'warn' | 'error';

  constructor(context: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.context = context;
    this.level = level;
  }

  /**
   * Log info level message
   */
  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  /**
   * Log debug level message
   */
  debug(message: string, data?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data);
    }
  }

  /**
   * Log warning level message
   */
  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error | Record<string, any>, data?: Record<string, any>): void {
    const errorData = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
      ...data,
    } : {
      ...error,
      ...data,
    };
    this.log('error', message, errorData);
  }

  /**
   * Log calculation event
   */
  logCalculation(
    calculatorType: string,
    userId: number,
    projectId: string | number,
    success: boolean,
    duration: number,
    details?: Record<string, any>
  ): void {
    this.info('Calculation executed', {
      calculatorType,
      userId,
      projectId,
      success,
      durationMs: duration,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Log audit event
   */
  logAudit(
    action: string,
    userId: number,
    userName: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ): void {
    this.info('Audit event', {
      action,
      userId,
      userName,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Log security event
   */
  logSecurity(
    event: string,
    userId: number,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): void {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    this.log(level, `Security event: ${event}`, {
      userId,
      severity,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(
    operation: string,
    durationMs: number,
    success: boolean,
    details?: Record<string, any>
  ): void {
    const level = durationMs > 1000 ? 'warn' : 'info';
    this.log(level, `Performance: ${operation}`, {
      durationMs,
      success,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Internal log method
   */
  private log(level: string, message: string, data?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...data,
    };

    // In production, this would go to pino logger
    // For now, use console with structured format
    const logMethod = console[level as keyof typeof console] || console.log;
    logMethod(JSON.stringify(logEntry));
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return (levels[level as keyof typeof levels] || 0) >= (levels[this.level] || 0);
  }
}

/**
 * Create logger instance for a module
 */
export function createLogger(context: string): StructuredLogger {
  return new StructuredLogger(context);
}

/**
 * Global logger instance
 */
export const logger = createLogger('CodeComply');

export default StructuredLogger;
