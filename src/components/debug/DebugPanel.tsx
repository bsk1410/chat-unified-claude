// ============================================================================
// Debug Panel Component
// Collapsible panel showing application logs with filtering
// ============================================================================

import { useEffect, useRef, useMemo } from 'react';
import {
  X,
  Trash2,
  Download,
  Settings,
  RefreshCw,
  Filter,
  ArrowDown,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { LogEntry } from './LogEntry';
import { useDebugStore, selectFilteredLogs } from '../../stores/debugStore';
import { cn } from '../../lib/utils';
import type { LogLevel } from '../../types/persona';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface DebugPanelProps {
  className?: string;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function DebugPanel({ className }: DebugPanelProps) {
  const isOpen = useDebugStore((s) => s.isDebugPanelOpen);
  const setOpen = useDebugStore((s) => s.setDebugPanelOpen);
  const logs = useDebugStore(selectFilteredLogs);
  const allLogs = useDebugStore((s) => s.logs);
  const filterLevel = useDebugStore((s) => s.filterLevel);
  const filterCategory = useDebugStore((s) => s.filterCategory);
  const autoScroll = useDebugStore((s) => s.autoScroll);
  const isEnabled = useDebugStore((s) => s.isEnabled);
  const setFilterLevel = useDebugStore((s) => s.setFilterLevel);
  const setFilterCategory = useDebugStore((s) => s.setFilterCategory);
  const setAutoScroll = useDebugStore((s) => s.setAutoScroll);
  const setEnabled = useDebugStore((s) => s.setEnabled);
  const clearLogs = useDebugStore((s) => s.clearLogs);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(allLogs.map((l) => l.category));
    return Array.from(cats).sort();
  }, [allLogs]);

  // Level counts
  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
    allLogs.forEach((log) => {
      counts[log.level]++;
    });
    return counts;
  }, [allLogs]);

  // Export logs
  const handleExport = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 left-0 z-50',
        'bg-background border-t shadow-2xl',
        'transition-all duration-300 ease-in-out',
        className
      )}
      style={{ height: '40vh', minHeight: '300px', maxHeight: '60vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Debug Console</h3>

          {/* Level badges */}
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {levelCounts.error} errors
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {levelCounts.warn} warnings
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {allLogs.length} total
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <div className="flex items-center gap-2 mr-2">
            <Switch
              id="auto-scroll"
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
              className="h-4 w-8"
            />
            <Label htmlFor="auto-scroll" className="text-xs text-muted-foreground cursor-pointer">
              Auto-scroll
            </Label>
          </div>

          {/* Actions */}
          <Button variant="ghost" size="icon" onClick={handleExport} className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={clearLogs} className="h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/10">
        <Filter className="h-4 w-4 text-muted-foreground" />

        <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v as LogLevel | 'all')}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory || 'all'} onValueChange={(v) => setFilterCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search messages..."
          className="h-8 text-xs flex-1 max-w-xs"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        />

        {/* Enable/disable logging */}
        <div className="flex items-center gap-2 ml-auto">
          <Switch
            id="logging-enabled"
            checked={isEnabled}
            onCheckedChange={setEnabled}
            className="h-4 w-8"
          />
          <Label htmlFor="logging-enabled" className="text-xs text-muted-foreground cursor-pointer">
            Logging {isEnabled ? 'ON' : 'OFF'}
          </Label>
        </div>
      </div>

      {/* Log list */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ height: 'calc(100% - 88px)' }}
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <RefreshCw className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No logs to display</p>
            <p className="text-xs">Logs will appear here as actions are performed</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {!autoScroll && logs.length > 10 && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 shadow-lg"
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
        >
          <ArrowDown className="h-4 w-4 mr-1" />
          Scroll to bottom
        </Button>
      )}
    </div>
  );
}
