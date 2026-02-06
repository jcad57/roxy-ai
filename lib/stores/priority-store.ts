/**
 * Priority Store - Zustand State Management
 * Centralized state for PriorityLayout component
 * Manages clusters, priority filters, reply box, and AI suggestions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Email, EmailCluster } from '@/lib/types/email';

/**
 * Priority Filter Types
 */
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

/**
 * Store State Interface
 */
interface PriorityStore {
  // === FILTER STATE ===
  activeCluster: EmailCluster | null;
  activePriority: PriorityFilter;
  
  // === REPLY STATE ===
  replyText: string;
  showReplyBox: boolean;
  
  // === AI SUGGESTION STATE ===
  showAISuggestion: boolean;
  
  // === FILTER ACTIONS ===
  setActiveCluster: (cluster: EmailCluster | null) => void;
  toggleCluster: (cluster: EmailCluster) => void;
  clearCluster: () => void;
  setActivePriority: (priority: PriorityFilter) => void;
  
  // === REPLY ACTIONS ===
  setReplyText: (text: string) => void;
  setShowReplyBox: (show: boolean) => void;
  openReplyBox: () => void;
  closeReplyBox: () => void;
  clearReply: () => void;
  
  // === AI SUGGESTION ACTIONS ===
  setShowAISuggestion: (show: boolean) => void;
  openAISuggestion: () => void;
  closeAISuggestion: () => void;
  
  // === COMBINED ACTIONS ===
  resetFilters: () => void;
  closeAllPanels: () => void;
}

/**
 * Default state values
 */
const DEFAULT_STATE = {
  activeCluster: null,
  activePriority: 'all' as PriorityFilter,
  replyText: '',
  showReplyBox: false,
  showAISuggestion: false,
};

/**
 * Create Priority Store with Zustand
 * - Uses devtools for debugging
 * - Persists filters to localStorage
 */
export const usePriorityStore = create<PriorityStore>()(
  devtools(
    persist(
      (set, get) => ({
        // === INITIAL STATE ===
        ...DEFAULT_STATE,
        
        // === FILTER ACTIONS ===
        setActiveCluster: (cluster) => 
          set({ activeCluster: cluster }, false, 'setActiveCluster'),
        
        toggleCluster: (cluster) => {
          const { activeCluster } = get();
          set(
            { activeCluster: activeCluster === cluster ? null : cluster },
            false,
            'toggleCluster'
          );
        },
        
        clearCluster: () => 
          set({ activeCluster: null }, false, 'clearCluster'),
        
        setActivePriority: (priority) => 
          set({ activePriority: priority }, false, 'setActivePriority'),
        
        // === REPLY ACTIONS ===
        setReplyText: (text) => 
          set({ replyText: text }, false, 'setReplyText'),
        
        setShowReplyBox: (show) => 
          set({ showReplyBox: show }, false, 'setShowReplyBox'),
        
        openReplyBox: () => 
          set({ showReplyBox: true }, false, 'openReplyBox'),
        
        closeReplyBox: () => 
          set({ showReplyBox: false, replyText: '' }, false, 'closeReplyBox'),
        
        clearReply: () => 
          set({ replyText: '' }, false, 'clearReply'),
        
        // === AI SUGGESTION ACTIONS ===
        setShowAISuggestion: (show) => 
          set({ showAISuggestion: show }, false, 'setShowAISuggestion'),
        
        openAISuggestion: () => 
          set({ showAISuggestion: true }, false, 'openAISuggestion'),
        
        closeAISuggestion: () => 
          set({ showAISuggestion: false }, false, 'closeAISuggestion'),
        
        // === COMBINED ACTIONS ===
        resetFilters: () => 
          set(
            { activeCluster: null, activePriority: 'all' },
            false,
            'resetFilters'
          ),
        
        closeAllPanels: () => 
          set(
            {
              showReplyBox: false,
              showAISuggestion: false,
              replyText: '',
            },
            false,
            'closeAllPanels'
          ),
      }),
      {
        name: 'priority-storage', // localStorage key
        partialize: (state) => ({
          // Only persist filter state
          activeCluster: state.activeCluster,
          activePriority: state.activePriority,
        }),
      }
    ),
    { name: 'PriorityStore' } // DevTools name
  )
);

/**
 * Selectors for optimized component subscriptions
 */
export const prioritySelectors = {
  // Filters
  activeCluster: (state: PriorityStore) => state.activeCluster,
  activePriority: (state: PriorityStore) => state.activePriority,
  filters: (state: PriorityStore) => ({
    activeCluster: state.activeCluster,
    activePriority: state.activePriority,
  }),
  
  // Reply State
  replyText: (state: PriorityStore) => state.replyText,
  showReplyBox: (state: PriorityStore) => state.showReplyBox,
  replyState: (state: PriorityStore) => ({
    replyText: state.replyText,
    showReplyBox: state.showReplyBox,
  }),
  
  // AI Suggestion State
  showAISuggestion: (state: PriorityStore) => state.showAISuggestion,
  
  // Panels
  panels: (state: PriorityStore) => ({
    showReplyBox: state.showReplyBox,
    showAISuggestion: state.showAISuggestion,
  }),
  
  // Actions only
  actions: (state: PriorityStore) => ({
    setActiveCluster: state.setActiveCluster,
    toggleCluster: state.toggleCluster,
    setActivePriority: state.setActivePriority,
    setReplyText: state.setReplyText,
    openReplyBox: state.openReplyBox,
    closeReplyBox: state.closeReplyBox,
    openAISuggestion: state.openAISuggestion,
    closeAISuggestion: state.closeAISuggestion,
    resetFilters: state.resetFilters,
    closeAllPanels: state.closeAllPanels,
  }),
};
