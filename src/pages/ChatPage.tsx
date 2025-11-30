// ============================================================================
// Chat Page
// Main chat interface with persona selection sidebar
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  MessageSquare,
  History,
  Settings as SettingsIcon,
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChatContainer,
  ChatHeader,
  MessageList,
  MessageInput,
  EmptyState,
} from '@/components/chat';
import { DebugPanel, DebugToggle } from '@/components/debug';
import { useChatStore } from '@/stores/chatStore';
import { debugLog } from '@/stores/debugStore';
import { useAuth } from '@/hooks';
import { personaApi, conversationApi, chatApi } from '@/lib/api-client';
import { ROUTES, PERSONA_ENGINE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Persona, Conversation, Message } from '@/types/persona';

// ----------------------------------------------------------------------------
// Sidebar Component
// ----------------------------------------------------------------------------

interface SidebarProps {
  personas: Persona[];
  conversations: Conversation[];
  activePersonaId?: string;
  activeConversationId?: string;
  isLoading: boolean;
  onSelectPersona: (persona: Persona) => void;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

function Sidebar({
  personas,
  conversations,
  activePersonaId,
  activeConversationId,
  isLoading,
  onSelectPersona,
  onSelectConversation,
  onNewConversation,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <div className="p-3 border-b">
        <Button onClick={onNewConversation} className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Personas section */}
        <div className="p-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Personas
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : personas.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-4">
              No personas yet
            </p>
          ) : (
            <div className="space-y-1">
              {personas.map((persona) => {
                const typeInfo = PERSONA_ENGINE.PERSONA_TYPES.find(
                  (t) => t.value === persona.type
                );
                return (
                  <button
                    key={persona.id}
                    onClick={() => onSelectPersona(persona)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all',
                      'hover:bg-accent',
                      activePersonaId === persona.id && 'bg-accent'
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={persona.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {persona.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{persona.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {typeInfo?.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversations section */}
        {activePersonaId && (
          <div className="p-3 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center">
              <History className="mr-1.5 h-3.5 w-3.5" />
              Recent Chats
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-2">
                No conversations yet
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.slice(0, 10).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv)}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all',
                      'hover:bg-accent',
                      activeConversationId === conv.id && 'bg-accent'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate flex-1">
                      {conv.title || 'New conversation'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

export function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Chat store
  const {
    activePersona,
    activeConversation,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    inputValue,
    setActivePersona,
    setActiveConversation,
    setMessages,
    addMessage,
    setLoading,
    setStreaming,
    appendStreamingContent,
    clearStreamingContent,
    setError,
    setInputValue,
  } = useChatStore();

  // Load personas on mount
  useEffect(() => {
    async function loadPersonas() {
      if (!accessToken) return;

      try {
        debugLog.info('Chat', 'Loading personas');
        const response = await personaApi.list(accessToken);
        setPersonas(response.data);

        // Select first persona if none selected
        if (response.data.length > 0 && !activePersona) {
          setActivePersona(response.data[0]);
        }
      } catch (err) {
        debugLog.error('Chat', 'Failed to load personas', err);
        setError('Failed to load personas');
      } finally {
        setIsLoadingData(false);
      }
    }

    loadPersonas();
  }, [accessToken]);

  // Load conversations when persona changes
  useEffect(() => {
    async function loadConversations() {
      if (!accessToken || !activePersona) {
        setConversations([]);
        return;
      }

      try {
        debugLog.info('Chat', 'Loading conversations', { personaId: activePersona.id });
        const response = await conversationApi.list(accessToken, activePersona.id);
        setConversations(response.data);
      } catch (err) {
        debugLog.error('Chat', 'Failed to load conversations', err);
      }
    }

    loadConversations();
  }, [accessToken, activePersona?.id]);

  // Load conversation messages when conversation changes
  useEffect(() => {
    async function loadMessages() {
      if (!accessToken || !activeConversation) {
        setMessages([]);
        return;
      }

      try {
        debugLog.info('Chat', 'Loading messages', { conversationId: activeConversation.id });
        const response = await conversationApi.get(accessToken, activeConversation.id);
        setMessages(response.messages || []);
      } catch (err) {
        debugLog.error('Chat', 'Failed to load messages', err);
      }
    }

    loadMessages();
  }, [accessToken, activeConversation?.id]);

  // Handle persona selection
  const handleSelectPersona = useCallback((persona: Persona) => {
    debugLog.info('Chat', 'Selected persona', { personaId: persona.id, name: persona.name });
    setActivePersona(persona);
    setActiveConversation(null);
    setMessages([]);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    debugLog.info('Chat', 'Selected conversation', { conversationId: conversation.id });
    setActiveConversation(conversation);
    navigate(`${ROUTES.CHAT}/${conversation.id}`);
  }, [navigate]);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    debugLog.info('Chat', 'Starting new conversation');
    setActiveConversation(null);
    setMessages([]);
    navigate(ROUTES.CHAT);
  }, [navigate]);

  // Handle send message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!accessToken || !activePersona) return;

    debugLog.info('Chat', 'Sending message', { content: content.substring(0, 50) });
    setError(null);
    setLoading(true);

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

    try {
      // Use streaming
      setStreaming(true);
      clearStreamingContent();

      await chatApi.streamMessage(
        accessToken,
        {
          message: content,
          persona_id: activePersona.id,
          conversation_id: activeConversation?.id,
        },
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            appendStreamingContent(chunk.content);
          } else if (chunk.type === 'done') {
            // Add assistant message
            const assistantMessage: Message = {
              id: chunk.message_id || `msg-${Date.now()}`,
              conversation_id: chunk.conversation_id || activeConversation?.id || '',
              role: 'assistant',
              content: useChatStore.getState().streamingContent,
              token_count: chunk.token_count || 0,
              is_summarized: false,
              included_in_summary_id: null,
              metadata: {},
              created_at: new Date().toISOString(),
            };
            addMessage(assistantMessage);
            clearStreamingContent();

            // Update conversation if new
            if (chunk.conversation_id && !activeConversation) {
              conversationApi.get(accessToken, chunk.conversation_id).then((conv) => {
                setActiveConversation(conv);
                navigate(`${ROUTES.CHAT}/${conv.id}`);
              });
            }
          } else if (chunk.type === 'error') {
            setError(chunk.error || 'Failed to get response');
          }
        }
      );
    } catch (err: unknown) {
      debugLog.error('Chat', 'Send message failed', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }, [accessToken, activePersona, activeConversation, navigate]);

  return (
    <>
      <DashboardLayout>
        <div className="flex h-[calc(100vh-80px)] -my-8 -mx-4 sm:-mx-6 lg:-mx-8">
          {/* Sidebar */}
          <div
            className={cn(
              'border-r bg-muted/30 transition-all duration-300 flex-shrink-0',
              sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
            )}
          >
            <Sidebar
              personas={personas}
              conversations={conversations}
              activePersonaId={activePersona?.id}
              activeConversationId={activeConversation?.id}
              isLoading={isLoadingData}
              onSelectPersona={handleSelectPersona}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header with sidebar toggle */}
            <div className="flex items-center gap-2 px-2 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1">
                <ChatHeader
                  persona={activePersona}
                  conversation={activeConversation}
                />
              </div>
            </div>

            {/* Chat content */}
            <div className="flex-1 flex flex-col min-h-0">
              {activePersona ? (
                <>
                  <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 && !isStreaming ? (
                      <EmptyState persona={activePersona} />
                    ) : (
                      <MessageList
                        messages={messages}
                        streamingContent={isStreaming ? streamingContent : undefined}
                        isLoading={isLoading}
                      />
                    )}
                  </div>
                  <MessageInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendMessage}
                    disabled={isLoading || isStreaming}
                    placeholder={`Message ${activePersona.name}...`}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Select a Persona</h3>
                    <p className="text-muted-foreground">
                      Choose a persona from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t border-destructive/20">
                {error}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Debug components */}
      <DebugToggle />
      <DebugPanel />
    </>
  );
}

export default ChatPage;
