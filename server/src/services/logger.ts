// ============================================================================
// Logger Service - Multi-level logging with UI support
// Provides detailed, robust logging that can be disabled and viewed in UI
// ============================================================================

import { LOGGING, LogLevel } from '../lib/constants';
import { nanoid } from 'nanoid';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  includeTimestamps: boolean;
  includeRequestId: boolean;
  retentionCount: number;
  consoleOutput: boolean;
}

// ----------------------------------------------------------------------------
// Log Level Priority
// ----------------------------------------------------------------------------

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ----------------------------------------------------------------------------
// Log Store (in-memory for UI access)
// ----------------------------------------------------------------------------

class LogStore {
  private logs: LogEntry[] = [];
  private maxSize: number;
  private listeners: Set<(log: LogEntry) => void> = new Set();

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  add(entry: LogEntry): void {
    this.logs.push(entry);

    // Trim if exceeds max size
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(entry));
  }

  getAll(): LogEntry[] {
    return [...this.logs];
  }

  getFiltered(options: {
    level?: LogLevel;
    category?: string;
    requestId?: string;
    since?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.logs;

    if (options.level) {
      const minPriority = LOG_LEVEL_PRIORITY[options.level];
      filtered = filtered.filter(
        (log) => LOG_LEVEL_PRIORITY[log.level] >= minPriority
      );
    }

    if (options.category) {
      filtered = filtered.filter((log) => log.category === options.category);
    }

    if (options.requestId) {
      filtered = filtered.filter((log) => log.requestId === options.requestId);
    }

    if (options.since) {
      filtered = filtered.filter((log) => log.timestamp >= options.since);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  clear(): void {
    this.logs = [];
  }

  subscribe(callback: (log: LogEntry) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// ----------------------------------------------------------------------------
// Logger Class
// ----------------------------------------------------------------------------

class Logger {
  private config: LoggerConfig;
  private store: LogStore;
  private currentRequestId?: string;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LOGGING.DEFAULT_LEVEL,
      enabled: true,
      includeTimestamps: LOGGING.INCLUDE_TIMESTAMPS,
      includeRequestId: LOGGING.INCLUDE_REQUEST_ID,
      retentionCount: LOGGING.LOG_RETENTION_COUNT,
      consoleOutput: true,
      ...config,
    };
    this.store = new LogStore(this.config.retentionCount);
  }

  // Configuration methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  setRequestId(requestId: string): void {
    this.currentRequestId = requestId;
  }

  clearRequestId(): void {
    this.currentRequestId = undefined;
  }

  // Check if should log at given level
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  // Core logging method
  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown,
    options?: { duration?: number; error?: Error }
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      id: nanoid(10),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      requestId: this.currentRequestId,
      duration: options?.duration,
    };

    if (options?.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack,
      };
    }

    // Store for UI
    this.store.add(entry);

    // Console output
    if (this.config.consoleOutput) {
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = this.formatPrefix(entry);
    const args: unknown[] = [prefix, entry.message];

    if (entry.data !== undefined) {
      args.push(entry.data);
    }

    if (entry.duration !== undefined) {
      args.push(`[${entry.duration}ms]`);
    }

    switch (entry.level) {
      case 'debug':
        console.debug(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'error':
        console.error(...args);
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  private formatPrefix(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.config.includeTimestamps) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      parts.push(`[${time}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(`[${entry.category}]`);

    if (this.config.includeRequestId && entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }

    return parts.join(' ');
  }

  // Convenience methods
  debug(category: string, message: string, data?: unknown): void {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: unknown): void {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: unknown): void {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, error?: Error, data?: unknown): void {
    this.log('error', category, message, data, { error });
  }

  // Timing helper
  time(category: string, operation: string): () => void {
    const start = performance.now();
    this.debug(category, `Starting: ${operation}`);

    return () => {
      const duration = Math.round(performance.now() - start);
      this.debug(category, `Completed: ${operation}`, undefined, { duration });
    };
  }

  // Async timing helper
  async timeAsync<T>(
    category: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const end = this.time(category, operation);
    try {
      const result = await fn();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }

  // Log store access for UI
  getLogs(options?: Parameters<LogStore['getFiltered']>[0]): LogEntry[] {
    return options ? this.store.getFiltered(options) : this.store.getAll();
  }

  clearLogs(): void {
    this.store.clear();
  }

  exportLogs(): string {
    return this.store.export();
  }

  subscribeLogs(callback: (log: LogEntry) => void): () => void {
    return this.store.subscribe(callback);
  }
}

// ----------------------------------------------------------------------------
// Singleton Instance
// ----------------------------------------------------------------------------

export const logger = new Logger();

// ----------------------------------------------------------------------------
// Category Constants for Consistency
// ----------------------------------------------------------------------------

export const LOG_CATEGORIES = {
  AUTH: 'auth',
  API: 'api',
  DB: 'database',
  LLM: 'llm',
  MEMORY: 'memory',
  CONTEXT: 'context',
  CHAT: 'chat',
  SUMMARIZATION: 'summarization',
  EMBEDDING: 'embedding',
  IMPORT: 'import',
  TRADE: 'trade',
  MIDDLEWARE: 'middleware',
  REQUEST: 'request',
  RESPONSE: 'response',
  ERROR: 'error',
} as const;

// ----------------------------------------------------------------------------
// Request Context Logger
// ----------------------------------------------------------------------------

export function createRequestLogger(requestId: string): {
  debug: (category: string, message: string, data?: unknown) => void;
  info: (category: string, message: string, data?: unknown) => void;
  warn: (category: string, message: string, data?: unknown) => void;
  error: (category: string, message: string, error?: Error, data?: unknown) => void;
} {
  return {
    debug: (category, message, data) => {
      logger.setRequestId(requestId);
      logger.debug(category, message, data);
      logger.clearRequestId();
    },
    info: (category, message, data) => {
      logger.setRequestId(requestId);
      logger.info(category, message, data);
      logger.clearRequestId();
    },
    warn: (category, message, data) => {
      logger.setRequestId(requestId);
      logger.warn(category, message, data);
      logger.clearRequestId();
    },
    error: (category, message, error, data) => {
      logger.setRequestId(requestId);
      logger.error(category, message, error, data);
      logger.clearRequestId();
    },
  };
}
