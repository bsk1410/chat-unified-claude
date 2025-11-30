// ============================================================================
// Debug Store
// Zustand store for debug/logging state management
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, LogLevel } from '../types/persona';
import { PERSONA_ENGINE } from '../lib/constants';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface DebugState {
  // Panel visibility
  isDebugPanelOpen: boolean;

  // Logs
  logs: LogEntry[];
  filterLevel: LogLevel | 'all';
  filterCategory: string;

  // Settings
  isEnabled: boolean;
  autoScroll: boolean;

  // Actions
  toggleDebugPanel: () => void;
  setDebugPanelOpen: (open: boolean) => void;

  addLog: (log: LogEntry) => void;
  addLogs: (logs: LogEntry[]) => void;
  clearLogs: () => void;

  setFilterLevel: (level: LogLevel | 'all') => void;
  setFilterCategory: (category: string) => void;

  setEnabled: (enabled: boolean) => void;
  setAutoScroll: (autoScroll: boolean) => void;
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useDebugStore = create<DebugState>()(
  persist(
    (set, get) => ({
      // Initial state
      isDebugPanelOpen: false,
      logs: [],
      filterLevel: 'all',
      filterCategory: '',
      isEnabled: PERSONA_ENGINE.DEBUG_ENABLED,
      autoScroll: true,

      // Actions
      toggleDebugPanel: () =>
        set((state) => ({ isDebugPanelOpen: !state.isDebugPanelOpen })),

      setDebugPanelOpen: (isDebugPanelOpen) => set({ isDebugPanelOpen }),

      addLog: (log) =>
        set((state) => {
          const logs = [...state.logs, log];
          // Keep only recent logs
          if (logs.length > PERSONA_ENGINE.LOG_RETENTION_COUNT) {
            return { logs: logs.slice(-PERSONA_ENGINE.LOG_RETENTION_COUNT) };
          }
          return { logs };
        }),

      addLogs: (newLogs) =>
        set((state) => {
          const logs = [...state.logs, ...newLogs];
          if (logs.length > PERSONA_ENGINE.LOG_RETENTION_COUNT) {
            return { logs: logs.slice(-PERSONA_ENGINE.LOG_RETENTION_COUNT) };
          }
          return { logs };
        }),

      clearLogs: () => set({ logs: [] }),

      setFilterLevel: (filterLevel) => set({ filterLevel }),

      setFilterCategory: (filterCategory) => set({ filterCategory }),

      setEnabled: (isEnabled) => set({ isEnabled }),

      setAutoScroll: (autoScroll) => set({ autoScroll }),
    }),
    {
      name: 'debug-store',
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        autoScroll: state.autoScroll,
        filterLevel: state.filterLevel,
      }),
    }
  )
);

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

export const selectIsDebugPanelOpen = (state: DebugState) => state.isDebugPanelOpen;
export const selectLogs = (state: DebugState) => state.logs;
export const selectFilteredLogs = (state: DebugState) => {
  let filtered = state.logs;

  if (state.filterLevel !== 'all') {
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    const minPriority = levelPriority[state.filterLevel];
    filtered = filtered.filter((log) => levelPriority[log.level] >= minPriority);
  }

  if (state.filterCategory) {
    filtered = filtered.filter((log) =>
      log.category.toLowerCase().includes(state.filterCategory.toLowerCase())
    );
  }

  return filtered;
};
export const selectIsDebugEnabled = (state: DebugState) => state.isEnabled;

// ----------------------------------------------------------------------------
// Client-side Logger
// ----------------------------------------------------------------------------

let logIdCounter = 0;

export function clientLog(
  level: LogLevel,
  category: string,
  message: string,
  data?: unknown
): void {
  const store = useDebugStore.getState();

  if (!store.isEnabled) return;

  const log: LogEntry = {
    id: `client-${++logIdCounter}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };

  store.addLog(log);

  // Also log to console in development
  if (import.meta.env.DEV) {
    const consoleMethod = level === 'error' ? console.error :
                          level === 'warn' ? console.warn :
                          level === 'debug' ? console.debug :
                          console.info;
    consoleMethod(`[${category}]`, message, data || '');
  }
}

// Convenience methods
export const debugLog = {
  debug: (category: string, message: string, data?: unknown) =>
    clientLog('debug', category, message, data),
  info: (category: string, message: string, data?: unknown) =>
    clientLog('info', category, message, data),
  warn: (category: string, message: string, data?: unknown) =>
    clientLog('warn', category, message, data),
  error: (category: string, message: string, data?: unknown) =>
    clientLog('error', category, message, data),
};
