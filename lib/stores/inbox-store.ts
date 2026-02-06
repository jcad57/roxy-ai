/**
 * Inbox Store - Zustand State Management
 * Centralized state for InboxLayout component
 * Manages folders, tabs, email selection, and category creation
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Email, FolderType } from '@/lib/types/email';

/**
 * Store State Interface
 */
interface InboxStore {
  // === FOLDER & TAB STATE ===
  activeFolder: FolderType;
  activeTab: string; // 'all' or custom category ID
  
  // === EMAIL SELECTION ===
  selectedEmail: Email | null;
  
  // === PANEL VISIBILITY ===
  showNewTabPanel: boolean;
  showResponsePanel: boolean;
  showEmailThreadPanel: boolean; // NEW: Email thread detail view
  
  // === CATEGORY FORM STATE ===
  newCategoryName: string;
  newCategoryColor: string;
  selectedTagIds: string[];
  
  // === FOLDER & TAB ACTIONS ===
  setActiveFolder: (folder: FolderType) => void;
  setActiveTab: (tab: string) => void;
  selectTab: (tab: string) => void; // Alias for consistency
  
  // === EMAIL SELECTION ACTIONS ===
  setSelectedEmail: (email: Email | null) => void;
  toggleEmailSelection: (email: Email) => void;
  clearSelectedEmail: () => void;
  
  // === PANEL ACTIONS ===
  setShowNewTabPanel: (show: boolean) => void;
  openNewCategoryPanel: () => void;
  closeNewCategoryPanel: () => void;
  setShowResponsePanel: (show: boolean) => void;
  openResponsePanel: () => void;
  closeResponsePanel: () => void;
  setShowEmailThreadPanel: (show: boolean) => void;
  openEmailThreadPanel: () => void;
  closeEmailThreadPanel: () => void;
  
  // === CATEGORY FORM ACTIONS ===
  setNewCategoryName: (name: string) => void;
  setNewCategoryColor: (color: string) => void;
  setSelectedTagIds: (tagIds: string[]) => void;
  toggleTagSelection: (tagId: string) => void;
  resetCategoryForm: () => void;
  
  // === COMBINED ACTIONS ===
  handleCancelCategory: () => void; // Closes panel and resets form
  switchToNewCategory: (categoryId: string) => void; // Switch tab and close panel
}

/**
 * Default category form state
 */
const DEFAULT_CATEGORY_STATE = {
  newCategoryName: '',
  newCategoryColor: '#3b82f6',
  selectedTagIds: [] as string[],
};

/**
 * Create Inbox Store with Zustand
 * - Uses devtools for debugging
 * - Persists activeFolder and activeTab to localStorage
 */
export const useInboxStore = create<InboxStore>()(
  devtools(
    persist(
      (set, get) => ({
        // === INITIAL STATE ===
        activeFolder: 'inbox',
        activeTab: 'all',
        selectedEmail: null,
        showNewTabPanel: false,
        showResponsePanel: false,
        showEmailThreadPanel: false,
        ...DEFAULT_CATEGORY_STATE,
        
        // === FOLDER & TAB ACTIONS ===
        setActiveFolder: (folder) => 
          set({ activeFolder: folder }, false, 'setActiveFolder'),
        
        setActiveTab: (tab) => 
          set({ activeTab: tab }, false, 'setActiveTab'),
        
        selectTab: (tab) => 
          set({ activeTab: tab }, false, 'selectTab'),
        
        // === EMAIL SELECTION ACTIONS ===
        setSelectedEmail: (email) => 
          set({ selectedEmail: email }, false, 'setSelectedEmail'),
        
        toggleEmailSelection: (email) => {
          const { selectedEmail } = get();
          const isDeselecting = selectedEmail?.id === email.id;
          set(
            { 
              selectedEmail: isDeselecting ? null : email,
              showEmailThreadPanel: !isDeselecting // Open panel when selecting, close when deselecting
            },
            false,
            'toggleEmailSelection'
          );
        },
        
        clearSelectedEmail: () => 
          set({ selectedEmail: null }, false, 'clearSelectedEmail'),
        
        // === PANEL ACTIONS ===
        setShowNewTabPanel: (show) => 
          set({ showNewTabPanel: show }, false, 'setShowNewTabPanel'),
        
        openNewCategoryPanel: () => 
          set({ showNewTabPanel: true }, false, 'openNewCategoryPanel'),
        
        closeNewCategoryPanel: () => 
          set({ showNewTabPanel: false }, false, 'closeNewCategoryPanel'),
        
        setShowResponsePanel: (show) => 
          set({ showResponsePanel: show }, false, 'setShowResponsePanel'),
        
        openResponsePanel: () => 
          set({ showResponsePanel: true }, false, 'openResponsePanel'),
        
        closeResponsePanel: () => 
          set({ showResponsePanel: false }, false, 'closeResponsePanel'),
        
        setShowEmailThreadPanel: (show) => 
          set({ showEmailThreadPanel: show }, false, 'setShowEmailThreadPanel'),
        
        openEmailThreadPanel: () => 
          set({ showEmailThreadPanel: true }, false, 'openEmailThreadPanel'),
        
        closeEmailThreadPanel: () => 
          set({ 
            showEmailThreadPanel: false,
            selectedEmail: null 
          }, false, 'closeEmailThreadPanel'),
        
        // === CATEGORY FORM ACTIONS ===
        setNewCategoryName: (name) => 
          set({ newCategoryName: name }, false, 'setNewCategoryName'),
        
        setNewCategoryColor: (color) => 
          set({ newCategoryColor: color }, false, 'setNewCategoryColor'),
        
        setSelectedTagIds: (tagIds) => 
          set({ selectedTagIds: tagIds }, false, 'setSelectedTagIds'),
        
        toggleTagSelection: (tagId) => {
          const { selectedTagIds } = get();
          set(
            {
              selectedTagIds: selectedTagIds.includes(tagId)
                ? selectedTagIds.filter((id) => id !== tagId)
                : [...selectedTagIds, tagId],
            },
            false,
            'toggleTagSelection'
          );
        },
        
        resetCategoryForm: () => 
          set(DEFAULT_CATEGORY_STATE, false, 'resetCategoryForm'),
        
        // === COMBINED ACTIONS ===
        handleCancelCategory: () => 
          set(
            { showNewTabPanel: false, ...DEFAULT_CATEGORY_STATE },
            false,
            'handleCancelCategory'
          ),
        
        switchToNewCategory: (categoryId) => 
          set(
            {
              activeTab: categoryId,
              showNewTabPanel: false,
              ...DEFAULT_CATEGORY_STATE,
            },
            false,
            'switchToNewCategory'
          ),
      }),
      {
        name: 'inbox-storage', // localStorage key
        partialize: (state) => ({
          // Only persist these values
          activeFolder: state.activeFolder,
          activeTab: state.activeTab,
        }),
      }
    ),
    { name: 'InboxStore' } // DevTools name
  )
);

/**
 * Selectors for optimized component subscriptions
 * Use these to prevent unnecessary re-renders
 */
export const inboxSelectors = {
  // Folder & Tab
  activeFolder: (state: InboxStore) => state.activeFolder,
  activeTab: (state: InboxStore) => state.activeTab,
  folderAndTab: (state: InboxStore) => ({
    activeFolder: state.activeFolder,
    activeTab: state.activeTab,
  }),
  
  // Email Selection
  selectedEmail: (state: InboxStore) => state.selectedEmail,
  
  // Panels
  showNewTabPanel: (state: InboxStore) => state.showNewTabPanel,
  showResponsePanel: (state: InboxStore) => state.showResponsePanel,
  panels: (state: InboxStore) => ({
    showNewTabPanel: state.showNewTabPanel,
    showResponsePanel: state.showResponsePanel,
  }),
  
  // Category Form
  categoryForm: (state: InboxStore) => ({
    newCategoryName: state.newCategoryName,
    newCategoryColor: state.newCategoryColor,
    selectedTagIds: state.selectedTagIds,
  }),
  
  // Actions only (for components that just need actions)
  actions: (state: InboxStore) => ({
    setActiveFolder: state.setActiveFolder,
    setActiveTab: state.setActiveTab,
    toggleEmailSelection: state.toggleEmailSelection,
    openNewCategoryPanel: state.openNewCategoryPanel,
    closeNewCategoryPanel: state.closeNewCategoryPanel,
    toggleTagSelection: state.toggleTagSelection,
    resetCategoryForm: state.resetCategoryForm,
    handleCancelCategory: state.handleCancelCategory,
    switchToNewCategory: state.switchToNewCategory,
  }),
};
