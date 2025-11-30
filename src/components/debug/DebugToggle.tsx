// ============================================================================
// Debug Toggle Component
// Floating button to toggle the debug panel visibility
// ============================================================================

import { Bug, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useDebugStore } from '../../stores/debugStore';
import { cn } from '../../lib/utils';
import { PERSONA_ENGINE } from '../../lib/constants';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface DebugToggleProps {
  className?: string;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function DebugToggle({ className }: DebugToggleProps) {
  const isOpen = useDebugStore((s) => s.isDebugPanelOpen);
  const toggle = useDebugStore((s) => s.toggleDebugPanel);
  const logs = useDebugStore((s) => s.logs);
  const isEnabled = useDebugStore((s) => s.isEnabled);

  // Don't render if debug is disabled globally
  if (!PERSONA_ENGINE.DEBUG_ENABLED) return null;

  // Count errors
  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  return (
    <div
      className={cn(
        'fixed z-[60] transition-all duration-300',
        isOpen ? 'bottom-[40vh] right-4' : 'bottom-4 right-4',
        className
      )}
    >
      <Button
        variant={isOpen ? 'default' : 'secondary'}
        size="icon"
        className={cn(
          'h-12 w-12 rounded-full shadow-lg transition-all duration-200',
          'hover:scale-110 active:scale-95',
          isOpen && 'bg-primary text-primary-foreground',
          !isEnabled && 'opacity-50'
        )}
        onClick={toggle}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Bug className="h-5 w-5" />
        )}
      </Button>

      {/* Error/warning badge */}
      {!isOpen && (errorCount > 0 || warnCount > 0) && (
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          {errorCount > 0 && (
            <Badge
              variant="destructive"
              className="h-5 min-w-5 px-1 text-xs font-bold rounded-full"
            >
              {errorCount > 99 ? '99+' : errorCount}
            </Badge>
          )}
          {warnCount > 0 && errorCount === 0 && (
            <Badge
              className="h-5 min-w-5 px-1 text-xs font-bold rounded-full bg-amber-500 hover:bg-amber-500"
            >
              {warnCount > 99 ? '99+' : warnCount}
            </Badge>
          )}
        </div>
      )}

      {/* Tooltip */}
      <div
        className={cn(
          'absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap',
          'px-2 py-1 rounded bg-popover text-popover-foreground text-sm shadow-md',
          'opacity-0 pointer-events-none transition-opacity',
          'group-hover:opacity-100'
        )}
      >
        {isOpen ? 'Close Debug Panel' : 'Open Debug Panel'}
      </div>
    </div>
  );
}
