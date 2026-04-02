import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Lightweight profile for feed attribution; sync with NextAuth later. */
export type CurrentUserState = {
  id: string;
  name: string;
  initials: string;
  karma: number;
};

const initialState: CurrentUserState = {
  id: "guest-local",
  name: "Guest",
  initials: "G",
  karma: 0,
};

const currentUserSlice = createSlice({
  name: "currentUser",
  initialState,
  reducers: {
    setCurrentUser(_state, action: PayloadAction<CurrentUserState>) {
      return action.payload;
    },
    bumpKarma(state, action: PayloadAction<number | undefined>) {
      state.karma += action.payload ?? 1;
    },
  },
});

export const { setCurrentUser, bumpKarma } = currentUserSlice.actions;
export default currentUserSlice.reducer;
