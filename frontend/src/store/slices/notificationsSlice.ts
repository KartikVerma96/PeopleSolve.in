import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type NotificationsState = {
  unreadThreads: number;
};

const initialState: NotificationsState = {
  unreadThreads: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setUnreadThreads(state, action: PayloadAction<number>) {
      state.unreadThreads = action.payload;
    },
    incrementUnread(state) {
      state.unreadThreads += 1;
    },
    clearUnread(state) {
      state.unreadThreads = 0;
    },
  },
});

export const { setUnreadThreads, incrementUnread, clearUnread } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
