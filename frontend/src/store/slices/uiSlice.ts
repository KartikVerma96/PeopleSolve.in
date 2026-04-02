import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Client UI state persisted to localStorage (sidebar preferences, etc.).
 * Domain data (doubts, chat) will use RTK Query or Socket.io later.
 */
export type UiState = {
  /** Desktop: narrow icon-only rail vs full labels */
  sidebarCollapsed: boolean;
  /** Last sidebar search query (for quick restore) */
  sidebarSearch: string;
};

const initialState: UiState = {
  sidebarCollapsed: false,
  sidebarSearch: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarSearch(state, action: PayloadAction<string>) {
      state.sidebarSearch = action.payload;
    },
  },
});

export const { setSidebarCollapsed, toggleSidebarCollapsed, setSidebarSearch } =
  uiSlice.actions;

export default uiSlice.reducer;
