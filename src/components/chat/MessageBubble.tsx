// ============================================================================
// Message Bubble Component
// Beautiful message bubble with user/assistant variants
// ============================================================================

import { useState } from 'react';
import { Check, Copy, RotateCcw, User, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { Message, Persona } from '../../types/persona';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  persona?: Persona | null;
  isStreaming?: boolean;
  isLatest?: boolean;
  onRetry?: () => void;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Simple markdown-like rendering
function renderContent(content: string): React.ReactNode {
  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      // Code block
      const match = part.match(/```(\w*)?\n?([\s\S]*?)```/);
      if (match) {
        const [, , code] = match;
        return (
          <pre
            key={index}
            className="my-3 p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm font-mono"
          >
            <code>{code.trim()}</code>
          </pre>
        );
      }
    }

    // Regular text with basic formatting
    return (
      <span key={index} className="whitespace-pre-wrap">
        {part.split(/(\*\*.*?\*\*)/g).map((segment, i) => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return <strong key={i}>{segment.slice(2, -2)}</strong>;
          }
          return segment;
        })}
      </span>
    );
  });
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function MessageBubble({
  message,
  persona,
  isStreaming,
  isLatest,
  onRetry,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'group flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        'w-8 h-8 shrink-0 ring-2',
        isUser
          ? 'ring-primary/20'
          : 'ring-secondary'
      )}>
        {isUser ? (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src={persona?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              {persona?.name?.charAt(0) || <Bot className="w-4 h-4" />}
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col max-w-[80%] min-w-0',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Name and time */}
        <div
          className={cn(
            'flex items-center gap-2 mb-1 text-xs text-muted-foreground',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="font-medium">
            {isUser ? 'You' : persona?.name || 'Assistant'}
          </span>
          <span>{formatTime(message.created_at)}</span>
        </div>

        {/* Message bubble */}
        <div
          className={cn(
            'relative px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/60 text-foreground rounded-bl-md',
            isStreaming && 'animate-pulse'
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {renderContent(message.content)}
          </div>

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse rounded-sm" />
          )}
        </div>

        {/* Actions */}
        {!isStreaming && !isUser && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isLatest && 'opacity-100'
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="ml-1.5 text-xs">
                {copied ? 'Copied' : 'Copy'}
              </span>
            </Button>

            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={onRetry}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="ml-1.5 text-xs">Retry</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
