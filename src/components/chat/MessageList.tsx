// ============================================================================
// Message List Component
// Renders chat messages with beautiful styling
// ============================================================================

import { MessageBubble } from './MessageBubble';
import type { Message, Persona } from '../../types/persona';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  persona?: Persona | null;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function MessageList({ messages, streamingContent, persona }: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          persona={persona}
          isLatest={index === messages.length - 1 && !streamingContent}
        />
      ))}

      {/* Streaming message */}
      {streamingContent && (
        <MessageBubble
          message={{
            id: 'streaming',
            conversation_id: '',
            role: 'assistant',
            content: streamingContent,
            token_count: 0,
            is_summarized: false,
            included_in_summary_id: null,
            metadata: {},
            created_at: new Date().toISOString(),
          }}
          persona={persona}
          isStreaming
          isLatest
        />
      )}
    </div>
  );
}
