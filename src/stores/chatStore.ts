// ============================================================================
// Chat Store
// Zustand store for chat state management
// ============================================================================

import { create } from 'zustand';
import type { Message, Conversation, Persona } from '../types/persona';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ChatState {
  // Current context
  activePersona: Persona | null;
  activeConversation: Conversation | null;
  messages: Message[];

  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Input
  inputValue: string;

  // Actions
  setActivePersona: (persona: Persona | null) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;

  // Loading state
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamingContent: (content: string) => void;
  clearStreamingContent: () => void;
  setError: (error: string | null) => void;

  // Input
  setInputValue: (value: string) => void;

  // Reset
  reset: () => void;
}

// ----------------------------------------------------------------------------
// Initial State
// ----------------------------------------------------------------------------

const initialState = {
  activePersona: null,
  activeConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
  inputValue: '',
};

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setActivePersona: (persona) => set({ activePersona: persona }),

  setActiveConversation: (conversation) => set({ activeConversation: conversation }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamingContent: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),

  clearStreamingContent: () => set({ streamingContent: '' }),

  setError: (error) => set({ error }),

  setInputValue: (inputValue) => set({ inputValue }),

  reset: () => set(initialState),
}));

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

export const selectActivePersona = (state: ChatState) => state.activePersona;
export const selectActiveConversation = (state: ChatState) => state.activeConversation;
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsLoading = (state: ChatState) => state.isLoading;
export const selectIsStreaming = (state: ChatState) => state.isStreaming;
export const selectStreamingContent = (state: ChatState) => state.streamingContent;
export const selectError = (state: ChatState) => state.error;
export const selectInputValue = (state: ChatState) => state.inputValue;
