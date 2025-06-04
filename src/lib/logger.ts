// ============================================================================
// SECURE LOGGING SERVICE
// Restaurant Loyalty Platform - Production-Safe Logging
// ============================================================================

interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  data?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  component?: string;
}

class SecureLogger {
  private isDevelopment: boolean;
  private currentLogLevel: number;
  private sensitiveFields: Set<string>;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.currentLogLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    this.sensitiveFields = new Set([
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'session',
      'email',
      'phone',
      'user_id',
      'id',
      'credit_card',
      'ssn',
      'api_key'
    ]);
  }

  /**
   * Sanitize data by removing or masking sensitive information
   */
  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field contains sensitive information
      const isSensitive = Array.from(this.sensitiveFields).some(field => 
        lowerKey.includes(field)
      );

      if (isSensitive) {
        if (typeof value === 'string') {
          // Mask sensitive strings
          sanitized[key] = value.length > 4 
            ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
            : '***';
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create a log entry with proper formatting
   */
  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    data?: Record<string, unknown>,
    component?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? this.sanitizeData(data) as Record<string, unknown> : undefined,
      component,
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId()
    };
  }

  /**
   * Get current session ID (safely)
   */
  private getSessionId(): string | undefined {
    try {
      return sessionStorage.getItem('session_id') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current user ID (safely)
   */
  private getCurrentUserId(): string | undefined {
    try {
      // Only in development, and only first 8 characters
      if (this.isDevelopment) {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.id ? parsed.id.substring(0, 8) + '...' : undefined;
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Send logs to external service (production only)
   */
  private async sendToLogService(entry: LogEntry): Promise<void> {
    if (this.isDevelopment) return;

    try {
      // In production, send to logging service
      // Example: Sentry, LogRocket, or custom endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Fail silently in production to avoid infinite loops
      console.error('Failed to send log to service:', error);
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: Record<string, unknown>, component?: string): void {
    if (LOG_LEVELS.DEBUG < this.currentLogLevel) return;

    const entry = this.createLogEntry('DEBUG', message, data, component);
    
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${entry.message}`, entry.data || '');
    }
  }

  /**
   * Log general information
   */
  info(message: string, data?: Record<string, unknown>, component?: string): void {
    if (LOG_LEVELS.INFO < this.currentLogLevel) return;

    const entry = this.createLogEntry('INFO', message, data, component);
    
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${entry.message}`, entry.data || '');
    } else {
      this.sendToLogService(entry);
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: Record<string, unknown>, component?: string): void {
    if (LOG_LEVELS.WARN < this.currentLogLevel) return;

    const entry = this.createLogEntry('WARN', message, data, component);
    
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${entry.message}`, entry.data || '');
    } else {
      this.sendToLogService(entry);
    }
  }

  /**
   * Log errors (always logged)
   */
  error(message: string, error?: Error | unknown, component?: string): void {
    const errorData: Record<string, unknown> = {};
    
    if (error instanceof Error) {
      errorData.error_name = error.name;
      errorData.error_message = error.message;
      errorData.stack = this.isDevelopment ? error.stack : '[REDACTED]';
    } else if (error) {
      errorData.error_data = this.sanitizeData(error);
    }

    const entry = this.createLogEntry('ERROR', message, errorData, component);
    
    // Always log errors to console
    console.error(`❌ [ERROR] ${entry.message}`, errorData);
    
    // Also send to service in production
    if (!this.isDevelopment) {
      this.sendToLogService(entry);
    }
  }

  /**
   * Log user actions for audit trail
   */
  audit(action: string, data?: Record<string, unknown>, component?: string): void {
    const entry = this.createLogEntry('INFO', `AUDIT: ${action}`, data, component);
    
    if (this.isDevelopment) {
      console.log(`📋 [AUDIT] ${action}`, entry.data || '');
    } else {
      this.sendToLogService(entry);
    }
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit: string = 'ms', component?: string): void {
    const data = { metric, value, unit };
    const entry = this.createLogEntry('INFO', `PERFORMANCE: ${metric}`, data, component);
    
    if (this.isDevelopment) {
      console.log(`⚡ [PERF] ${metric}: ${value}${unit}`, data);
    } else {
      this.sendToLogService(entry);
    }
  }

  /**
   * Log security events
   */
  security(event: string, data?: Record<string, unknown>, component?: string): void {
    const entry = this.createLogEntry('WARN', `SECURITY: ${event}`, data, component);
    
    // Always log security events
    console.warn(`🔒 [SECURITY] ${event}`, entry.data || '');
    
    if (!this.isDevelopment) {
      this.sendToLogService(entry);
    }
  }
}

// Create singleton instance
export const logger = new SecureLogger();

// Convenience exports for common patterns
export const logDebug = (message: string, data?: Record<string, unknown>, component?: string) => 
  logger.debug(message, data, component);

export const logInfo = (message: string, data?: Record<string, unknown>, component?: string) => 
  logger.info(message, data, component);

export const logWarn = (message: string, data?: Record<string, unknown>, component?: string) => 
  logger.warn(message, data, component);

export const logError = (message: string, error?: Error | unknown, component?: string) => 
  logger.error(message, error, component);

export const logAudit = (action: string, data?: Record<string, unknown>, component?: string) => 
  logger.audit(action, data, component);

export const logPerformance = (metric: string, value: number, unit?: string, component?: string) => 
  logger.performance(metric, value, unit, component);

export const logSecurity = (event: string, data?: Record<string, unknown>, component?: string) => 
  logger.security(event, data, component);

// Export logger instance as default
export default logger; 