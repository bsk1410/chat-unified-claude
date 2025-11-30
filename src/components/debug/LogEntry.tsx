// ============================================================================
// Log Entry Component
// Individual log entry display with expandable data
// ============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, AlertTriangle, Info, Bug } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { LogEntry as LogEntryType, LogLevel } from '../../types/persona';

// ----------------------------------------------------------------------------
// Level Configuration
// ----------------------------------------------------------------------------

const levelConfig: Record<LogLevel, { icon: typeof Info; color: string; bg: string }> = {
  debug: { icon: Bug, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  warn: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface LogEntryProps {
  log: LogEntryType;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function LogEntry({ log }: LogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = levelConfig[log.level];
  const Icon = config.icon;
  const hasData = log.data !== undefined || log.error !== undefined;

  // Format timestamp
  const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  return (
    <div
      className={cn(
        'border-b border-border/50 transition-colors',
        'hover:bg-muted/30',
        isExpanded && 'bg-muted/20'
      )}
    >
      {/* Main row */}
      <button
        className="w-full flex items-start gap-2 p-2 text-left"
        onClick={() => hasData && setIsExpanded(!isExpanded)}
      >
        {/* Expand icon */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
          {hasData ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )
          ) : null}
        </div>

        {/* Level icon */}
        <div className={cn('w-5 h-5 rounded flex items-center justify-center flex-shrink-0', config.bg)}>
          <Icon className={cn('w-3.5 h-3.5', config.color)} />
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground font-mono w-24 flex-shrink-0">
          {time}
        </span>

        {/* Category */}
        <span className={cn(
          'text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0',
          'bg-primary/10 text-primary'
        )}>
          {log.category}
        </span>

        {/* Message */}
        <span className="text-sm flex-1 truncate">{log.message}</span>

        {/* Duration if present */}
        {log.duration !== undefined && (
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
            {log.duration.toFixed(0)}ms
          </span>
        )}

        {/* Request ID if present */}
        {log.requestId && (
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0 max-w-[80px] truncate">
            {log.requestId.slice(0, 8)}
          </span>
        )}
      </button>

      {/* Expanded data */}
      {isExpanded && hasData && (
        <div className="px-2 pb-3 pt-1 ml-6">
          {/* Error details */}
          {log.error && (
            <div className="mb-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="font-mono text-sm text-destructive font-medium">
                {log.error.name}: {log.error.message}
              </div>
              {log.error.stack && (
                <pre className="mt-2 text-xs text-destructive/80 overflow-x-auto whitespace-pre-wrap">
                  {log.error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Data payload */}
          {log.data && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
