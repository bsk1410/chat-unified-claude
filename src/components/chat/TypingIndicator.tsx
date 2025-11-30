// ============================================================================
// Typing Indicator Component
// Animated dots showing the assistant is typing
// ============================================================================

import { cn } from '../../lib/utils';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface TypingIndicatorProps {
  className?: string;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-current animate-bounce" />
    </div>
  );
}
