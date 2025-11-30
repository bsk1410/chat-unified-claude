// ============================================================================
// Chat Container Component
// Main chat interface with a beautiful, modern design
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { EmptyState } from './EmptyState';
import { useChatStore } from '../../stores/chatStore';
import { chatApi } from '../../lib/api-client';
import { debugLog } from '../../stores/debugStore';
import type { Message, Persona, Conversation } from '../../types/persona';
import { cn } from '../../lib/utils';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface ChatContainerProps {
  persona?: Persona;
  conversation?: Conversation;
  initialMessages?: Message[];
  onConversationChange?: (conversationId: string) => void;
  className?: string;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ChatContainer({
  persona,
  conversation,
  initialMessages = [],
  onConversationChange,
  className,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    activePersona,
    activeConversation,
    messages,
    isStreaming,
    streamingContent,
    isLoading,
    error,
    inputValue,
    setActivePersona,
    setActiveConversation,
    setMessages,
    addMessage,
    setStreaming,
    appendStreamingContent,
    clearStreamingContent,
    setError,
    setInputValue,
  } = useChatStore();

  // Initialize from props
  useEffect(() => {
    if (persona) {
      setActivePersona(persona);
    }
    if (conversation) {
      setActiveConversation(conversation);
    }
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [persona, conversation, initialMessages, setActivePersona, setActiveConversation, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Send message handler
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isStreaming) return;
    if (!activePersona && !activeConversation) {
      setError('No persona or conversation selected');
      return;
    }

    debugLog.info('chat', 'Sending message', { content: content.slice(0, 50) });

    // Add user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation?.id || '',
      role: 'user',
      content,
      token_count: 0,
      is_summarized: false,
      included_in_summary_id: null,
      metadata: {},
      created_at: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInputValue('');
    setError(null);
    setStreaming(true);
    clearStreamingContent();

    try {
      // Stream response
      const stream = chatApi.stream(
        {
          conversation_id: activeConversation?.id,
          persona_id: activePersona?.id,
          message: content,
        },
        (conversationId) => {
          // Called when conversation ID is received
          if (!activeConversation?.id && conversationId) {
            onConversationChange?.(conversationId);
          }
        }
      );

      let fullContent = '';
      let messageId = '';

      for await (const chunk of stream) {
        if (chunk.type === 'chunk' && chunk.content) {
          fullContent += chunk.content;
          appendStreamingContent(chunk.content);
        } else if (chunk.type === 'done') {
          messageId = chunk.message_id || '';
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error);
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: messageId || `msg-${Date.now()}`,
        conversation_id: activeConversation?.id || '',
        role: 'assistant',
        content: fullContent,
        token_count: 0,
        is_summarized: false,
        included_in_summary_id: null,
        metadata: {},
        created_at: new Date().toISOString(),
      };

      addMessage(assistantMessage);
      debugLog.info('chat', 'Message received', { length: fullContent.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      debugLog.error('chat', 'Send message failed', err);
    } finally {
      setStreaming(false);
      clearStreamingContent();
    }
  }, [
    activePersona,
    activeConversation,
    isLoading,
    isStreaming,
    addMessage,
    setInputValue,
    setError,
    setStreaming,
    appendStreamingContent,
    clearStreamingContent,
    onConversationChange,
  ]);

  const showEmptyState = messages.length === 0 && !isStreaming;

  return (
    <div className={cn(
      'flex flex-col h-full bg-gradient-to-b from-background to-muted/20',
      className
    )}>
      {/* Header */}
      <ChatHeader
        persona={activePersona}
        conversation={activeConversation}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {showEmptyState ? (
            <EmptyState persona={activePersona} />
          ) : (
            <MessageList
              messages={messages}
              streamingContent={isStreaming ? streamingContent : undefined}
              persona={activePersona}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-background/80 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isLoading || isStreaming}
            placeholder={
              activePersona
                ? `Message ${activePersona.name}...`
                : 'Select a persona to start chatting...'
            }
            disabled={!activePersona && !activeConversation}
          />
        </div>
      </div>
    </div>
  );
}
