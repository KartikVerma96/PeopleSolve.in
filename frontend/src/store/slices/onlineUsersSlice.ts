import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Global presence — future Socket.io room counts. */
export type OnlineUsersState = {
  totalOnline: number;
  activeHelpers: number;
};

const initialState: OnlineUsersState = {
  totalOnline: 1284,
  activeHelpers: 56,
};

const onlineUsersSlice = createSlice({
  name: "onlineUsers",
  initialState,
  reducers: {
    setOnlineStats(
      state,
      action: PayloadAction<Partial<OnlineUsersState>>,
    ) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setOnlineStats } = onlineUsersSlice.actions;
export default onlineUsersSlice.reducer;
