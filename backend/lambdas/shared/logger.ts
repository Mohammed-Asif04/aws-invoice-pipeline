// ============================================================================
// AWS Invoice Pipeline — Structured Logger
// JSON-formatted logging for CloudWatch with correlation IDs
// ============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  invoiceId?: string;
  requestId?: string;
  correlationId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

class Logger {
  private service: string;
  private defaultMeta: Record<string, unknown>;

  constructor(service: string, defaultMeta: Record<string, unknown> = {}) {
    this.service = service;
    this.defaultMeta = defaultMeta;
  }

  /**
   * Create a child logger with additional default metadata (e.g., invoiceId, requestId)
   */
  child(meta: Record<string, unknown>): Logger {
    const child = new Logger(this.service, {
      ...this.defaultMeta,
      ...meta,
    });
    return child;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('DEBUG', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('WARN', message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error
        ? { name: 'UnknownError', message: String(error) }
        : undefined;

    this.log('ERROR', message, { ...meta, error: errorDetails });
  }

  /**
   * Log with timing — returns a function to call when done
   */
  startTimer(message: string, meta?: Record<string, unknown>): () => void {
    const start = Date.now();
    this.info(`${message} — started`, meta);

    return () => {
      const duration = Date.now() - start;
      this.info(`${message} — completed`, { ...meta, duration });
    };
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...(this.defaultMeta as Partial<LogEntry>),
      ...(meta as Partial<LogEntry>),
    };

    // CloudWatch expects JSON lines
    const output = JSON.stringify(entry);

    switch (level) {
      case 'ERROR':
        console.error(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'DEBUG':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }
}

/**
 * Create a logger instance for a Lambda function
 */
export function createLogger(service: string, meta?: Record<string, unknown>): Logger {
  return new Logger(service, meta);
}

export { Logger };
