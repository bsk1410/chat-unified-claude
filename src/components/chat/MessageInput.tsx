// ============================================================================
// Message Input Component
// Beautiful message input with send button
// ============================================================================

import { useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function MessageInput({
  value,
  onChange,
  onSend,
  isLoading = false,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 10000,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim());
    }
  }, [value, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    },
    [onChange, maxLength]
  );

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  return (
    <div className="relative">
      <div
        className={cn(
          'relative flex items-end gap-2 p-2 rounded-2xl border bg-background shadow-lg',
          'ring-offset-background transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            handleChange(e);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            'flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'text-sm placeholder:text-muted-foreground/60'
          )}
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={!value.trim() || isLoading || disabled}
          size="icon"
          className={cn(
            'shrink-0 h-10 w-10 rounded-xl transition-all duration-200',
            'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
            'disabled:from-muted disabled:to-muted disabled:text-muted-foreground',
            value.trim() && !isLoading && 'shadow-lg shadow-violet-500/25'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Character count */}
      {value.length > maxLength * 0.8 && (
        <div className="absolute right-14 bottom-4 text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      )}

      {/* Hint */}
      <p className="mt-2 text-xs text-center text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to send,{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
