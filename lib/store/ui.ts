import { create } from 'zustand';

export type DrawerKey =
  | 'ai-suggestion'
  | 'manual-picker'
  | 'event-detail'
  | 'reasoning'
  | 'log-detail'
  | 'confirm'
  | 'task-picker';

export interface UiState {
  sidebarCollapsed: boolean;
  openDrawer: DrawerKey | null;
  drawerPayload: unknown;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  openDrawerModal: (key: DrawerKey, payload?: unknown) => void;
  closeDrawer: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  openDrawer: null,
  drawerPayload: null,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openDrawerModal: (key, payload = null) => set({ openDrawer: key, drawerPayload: payload }),
  closeDrawer: () => set({ openDrawer: null, drawerPayload: null }),
}));
