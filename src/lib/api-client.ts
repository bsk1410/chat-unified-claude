// ============================================================================
// Persona Engine API Client
// Handles all API communication with the persona engine backend
// ============================================================================

import { PERSONA_ENGINE } from './constants';
import { getSession } from './auth';
import type {
  Persona,
  PersonaCreate,
  PersonaUpdate,
  Conversation,
  ConversationCreate,
  ConversationWithMessages,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  PersonaFact,
  FactCreate,
  FactUpdate,
  PersonaDocument,
  DocumentCreate,
  DocumentSearchResult,
  TradeSetup,
  TradeSetupCreate,
  TradeSetupUpdate,
  TradeSearchResult,
  ApiResponse,
  PaginatedResponse,
  LogEntry,
  UsageStats,
} from '../types/persona';

// ----------------------------------------------------------------------------
// API Client Configuration
// ----------------------------------------------------------------------------

const API_BASE = `${PERSONA_ENGINE.API_URL}/api/${PERSONA_ENGINE.API_VERSION}`;

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  const token = session?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }
  return response.json();
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  return handleResponse<T>(response);
}

// ----------------------------------------------------------------------------
// Personas API
// ----------------------------------------------------------------------------

export const personasApi = {
  list: async (): Promise<ApiResponse<Persona[]>> => {
    return apiRequest('/personas');
  },

  get: async (id: string): Promise<ApiResponse<Persona>> => {
    return apiRequest(`/personas/${id}`);
  },

  create: async (data: PersonaCreate): Promise<ApiResponse<Persona>> => {
    return apiRequest('/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: PersonaUpdate): Promise<ApiResponse<Persona>> => {
    return apiRequest(`/personas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest(`/personas/${id}`, {
      method: 'DELETE',
    });
  },

  import: async (
    id: string,
    data: { content: string; source_type?: string; source_url?: string }
  ): Promise<ApiResponse<{ documentsCreated: number }>> => {
    return apiRequest(`/personas/${id}/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ----------------------------------------------------------------------------
// Conversations API
// ----------------------------------------------------------------------------

export const conversationsApi = {
  list: async (params?: {
    persona_id?: string;
    archived?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Conversation>> => {
    const query = new URLSearchParams();
    if (params?.persona_id) query.set('persona_id', params.persona_id);
    if (params?.archived) query.set('archived', 'true');
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());

    const queryString = query.toString();
    return apiRequest(`/conversations${queryString ? `?${queryString}` : ''}`);
  },

  get: async (id: string, messageLimit?: number): Promise<ApiResponse<ConversationWithMessages>> => {
    const query = messageLimit ? `?message_limit=${messageLimit}` : '';
    return apiRequest(`/conversations/${id}${query}`);
  },

  create: async (data: ConversationCreate): Promise<ApiResponse<Conversation>> => {
    return apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest(`/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  archive: async (id: string): Promise<ApiResponse<Conversation>> => {
    return apiRequest(`/conversations/${id}/archive`, {
      method: 'POST',
    });
  },

  summarize: async (id: string): Promise<ApiResponse<unknown>> => {
    return apiRequest(`/conversations/${id}/summarize`, {
      method: 'POST',
    });
  },

  getContext: async (id: string): Promise<ApiResponse<unknown>> => {
    return apiRequest(`/conversations/${id}/context`);
  },
};

// ----------------------------------------------------------------------------
// Chat API
// ----------------------------------------------------------------------------

export const chatApi = {
  send: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  stream: async function* (
    data: ChatRequest,
    onStart?: (conversationId: string) => void
  ): AsyncGenerator<StreamChunk> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Stream error' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(6));
              if (chunk.type === 'start' && chunk.conversation_id) {
                onStart?.(chunk.conversation_id);
              }
              yield chunk;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

// ----------------------------------------------------------------------------
// Facts API
// ----------------------------------------------------------------------------

export const factsApi = {
  list: async (personaId: string): Promise<ApiResponse<PersonaFact[]>> => {
    return apiRequest(`/personas/${personaId}/facts`);
  },

  create: async (personaId: string, data: FactCreate): Promise<ApiResponse<PersonaFact>> => {
    return apiRequest(`/personas/${personaId}/facts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    personaId: string,
    factId: string,
    data: FactUpdate
  ): Promise<ApiResponse<PersonaFact>> => {
    return apiRequest(`/personas/${personaId}/facts/${factId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (personaId: string, factId: string): Promise<ApiResponse<void>> => {
    return apiRequest(`/personas/${personaId}/facts/${factId}`, {
      method: 'DELETE',
    });
  },
};

// ----------------------------------------------------------------------------
// Documents API
// ----------------------------------------------------------------------------

export const documentsApi = {
  list: async (personaId: string): Promise<ApiResponse<PersonaDocument[]>> => {
    return apiRequest(`/personas/${personaId}/documents`);
  },

  create: async (personaId: string, data: DocumentCreate): Promise<ApiResponse<{ documentsCreated: number }>> => {
    return apiRequest(`/personas/${personaId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (personaId: string, docId: string): Promise<ApiResponse<void>> => {
    return apiRequest(`/personas/${personaId}/documents/${docId}`, {
      method: 'DELETE',
    });
  },

  search: async (
    personaId: string,
    query: string,
    limit?: number
  ): Promise<ApiResponse<DocumentSearchResult[]>> => {
    return apiRequest(`/personas/${personaId}/documents/search`, {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  },
};

// ----------------------------------------------------------------------------
// Trades API
// ----------------------------------------------------------------------------

export const tradesApi = {
  list: async (params?: {
    persona_id?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<TradeSetup>> => {
    const query = new URLSearchParams();
    if (params?.persona_id) query.set('persona_id', params.persona_id);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());

    const queryString = query.toString();
    return apiRequest(`/trades${queryString ? `?${queryString}` : ''}`);
  },

  get: async (id: string): Promise<ApiResponse<TradeSetup>> => {
    return apiRequest(`/trades/${id}`);
  },

  create: async (data: TradeSetupCreate): Promise<ApiResponse<TradeSetup>> => {
    return apiRequest('/trades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: TradeSetupUpdate): Promise<ApiResponse<TradeSetup>> => {
    return apiRequest(`/trades/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest(`/trades/${id}`, {
      method: 'DELETE',
    });
  },

  findSimilar: async (
    query: string,
    options?: { limit?: number; persona_id?: string }
  ): Promise<ApiResponse<TradeSearchResult[]>> => {
    return apiRequest('/trades/similar', {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    });
  },
};

// ----------------------------------------------------------------------------
// Admin API
// ----------------------------------------------------------------------------

export const adminApi = {
  getSettings: async (): Promise<ApiResponse<unknown>> => {
    return apiRequest('/admin/settings');
  },

  getUsage: async (): Promise<ApiResponse<UsageStats>> => {
    return apiRequest('/admin/usage');
  },

  getLogs: async (params?: {
    level?: string;
    category?: string;
    limit?: number;
  }): Promise<ApiResponse<LogEntry[]>> => {
    const query = new URLSearchParams();
    if (params?.level) query.set('level', params.level);
    if (params?.category) query.set('category', params.category);
    if (params?.limit) query.set('limit', params.limit.toString());

    const queryString = query.toString();
    return apiRequest(`/admin/logs${queryString ? `?${queryString}` : ''}`);
  },

  clearLogs: async (): Promise<ApiResponse<void>> => {
    return apiRequest('/admin/logs/clear', {
      method: 'POST',
    });
  },

  exportLogs: async (): Promise<string> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/admin/logs/export`, { headers });
    return response.text();
  },
};
