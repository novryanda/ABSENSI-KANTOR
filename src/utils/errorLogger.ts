// ============================================================================
// ERROR LOGGER UTILITY
// src/utils/errorLogger.ts
// ============================================================================

interface ErrorContext {
  userId?: string
  component?: string
  action?: string
  url?: string
  userAgent?: string
  timestamp?: string
  additionalData?: Record<string, any>
}

interface ErrorLog {
  id: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  error?: Error
  context: ErrorContext
  timestamp: string
  stack?: string
}

class ErrorLogger {
  private logs: ErrorLog[] = []
  private maxLogs = 100
  private isProduction = process.env.NODE_ENV === 'production'

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private createLog(
    level: ErrorLog['level'],
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): ErrorLog {
    const timestamp = new Date().toISOString()
    
    return {
      id: this.generateId(),
      level,
      message,
      error,
      context: {
        ...context,
        timestamp,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      },
      timestamp,
      stack: error?.stack
    }
  }

  private addLog(log: ErrorLog) {
    this.logs.unshift(log)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Console output in development
    if (!this.isProduction) {
      const emoji = {
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🐛'
      }[log.level]

      console.group(`${emoji} ${log.level.toUpperCase()}: ${log.message}`)
      
      if (log.error) {
        console.error('Error:', log.error)
      }
      
      if (Object.keys(log.context).length > 0) {
        console.log('Context:', log.context)
      }
      
      if (log.stack) {
        console.log('Stack:', log.stack)
      }
      
      console.groupEnd()
    }

    // Send to monitoring service in production
    if (this.isProduction && log.level === 'error') {
      this.sendToMonitoring(log)
    }
  }

  private async sendToMonitoring(log: ErrorLog) {
    try {
      // Send to your monitoring service (e.g., Sentry, LogRocket, etc.)
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(log)
      })
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error)
    }
  }

  // Public methods
  error(message: string, error?: Error, context?: ErrorContext) {
    const log = this.createLog('error', message, error, context)
    this.addLog(log)
    return log.id
  }

  warn(message: string, context?: ErrorContext) {
    const log = this.createLog('warn', message, undefined, context)
    this.addLog(log)
    return log.id
  }

  info(message: string, context?: ErrorContext) {
    const log = this.createLog('info', message, undefined, context)
    this.addLog(log)
    return log.id
  }

  debug(message: string, context?: ErrorContext) {
    const log = this.createLog('debug', message, undefined, context)
    this.addLog(log)
    return log.id
  }

  // EventSource specific logging
  logEventSourceError(
    eventSource: EventSource,
    error: Event,
    context?: ErrorContext
  ) {
    const errorMessage = `EventSource connection failed`
    const errorContext = {
      ...context,
      component: 'EventSource',
      readyState: eventSource.readyState,
      url: eventSource.url,
      withCredentials: eventSource.withCredentials,
      readyStateText: this.getReadyStateText(eventSource.readyState)
    }

    return this.error(errorMessage, undefined, errorContext)
  }

  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case EventSource.CONNECTING:
        return 'CONNECTING'
      case EventSource.OPEN:
        return 'OPEN'
      case EventSource.CLOSED:
        return 'CLOSED'
      default:
        return 'UNKNOWN'
    }
  }

  // Get logs for debugging
  getLogs(level?: ErrorLog['level']): ErrorLog[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }

  // Get error statistics
  getStats() {
    const stats = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.logs.length,
      ...stats,
      lastError: this.logs.find(log => log.level === 'error')?.timestamp
    }
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger()

// Convenience functions
export const logError = (message: string, error?: Error, context?: ErrorContext) => 
  errorLogger.error(message, error, context)

export const logWarn = (message: string, context?: ErrorContext) => 
  errorLogger.warn(message, context)

export const logInfo = (message: string, context?: ErrorContext) => 
  errorLogger.info(message, context)

export const logDebug = (message: string, context?: ErrorContext) => 
  errorLogger.debug(message, context)

// EventSource specific helper
export const logEventSourceError = (
  eventSource: EventSource,
  error: Event,
  context?: ErrorContext
) => errorLogger.logEventSourceError(eventSource, error, context)

// Global error handler setup
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError('Unhandled Promise Rejection', event.reason, {
      component: 'GlobalErrorHandler',
      action: 'unhandledrejection'
    })
  })

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    logError('JavaScript Error', event.error, {
      component: 'GlobalErrorHandler',
      action: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })
}

export default errorLogger
