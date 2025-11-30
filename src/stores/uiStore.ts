// ============================================================================
// UI Store
// Zustand store for UI state management
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UI } from '@/lib/constants';
import type { Theme } from '@/types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
interface UIState {
  // Theme
  theme: Theme;

  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Mobile
  mobileMenuOpen: boolean;

  // Modals
  modals: Record<string, boolean>;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
}

interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Sidebar
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  // Mobile
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Modals
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  closeAllModals: () => void;

  // Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Reset
  reset: () => void;
}

type UIStore = UIState & UIActions;

// ----------------------------------------------------------------------------
// Initial State
// ----------------------------------------------------------------------------
const initialState: UIState = {
  theme: UI.DEFAULT_THEME,
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  modals: {},
  globalLoading: false,
  loadingMessage: null,
};

// ----------------------------------------------------------------------------
// Theme Helper
// ----------------------------------------------------------------------------
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  root.classList.remove('light', 'dark');
  root.classList.add(isDark ? 'dark' : 'light');
}

// ----------------------------------------------------------------------------
// Store Implementation
// ----------------------------------------------------------------------------
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Theme actions
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const current = get().theme;
        const next: Theme =
          current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
        applyTheme(next);
        set({ theme: next });
      },

      // Sidebar actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Mobile menu actions
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      // Modal actions
      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),

      closeModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: false },
        })),

      toggleModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: !state.modals[modalId] },
        })),

      closeAllModals: () => set({ modals: {} }),

      // Loading actions
      setGlobalLoading: (loading, message = null) =>
        set({ globalLoading: loading, loadingMessage: message }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------
export const selectTheme = (state: UIStore) => state.theme;
export const selectSidebarOpen = (state: UIStore) => state.sidebarOpen;
export const selectSidebarCollapsed = (state: UIStore) => state.sidebarCollapsed;
export const selectMobileMenuOpen = (state: UIStore) => state.mobileMenuOpen;
export const selectGlobalLoading = (state: UIStore) => state.globalLoading;
export const selectIsModalOpen = (modalId: string) => (state: UIStore) =>
  state.modals[modalId] ?? false;

// ----------------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------------

/**
 * Hook for managing a specific modal
 */
export function useModal(modalId: string) {
  const isOpen = useUIStore((state) => state.modals[modalId] ?? false);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const toggleModal = useUIStore((state) => state.toggleModal);

  return {
    isOpen,
    open: () => openModal(modalId),
    close: () => closeModal(modalId),
    toggle: () => toggleModal(modalId),
  };
}

export default useUIStore;
