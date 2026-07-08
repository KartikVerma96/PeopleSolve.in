import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import type { Doubt } from "@/store/types/doubt";

/** Fields required to append a doubt (IDs and counts optional). */
export type AddDoubtInput = Omit<
  Doubt,
  "id" | "createdAt" | "viewerCount" | "helperCount" | "resolved" | "needFasterMethod" | "mySolveTime"
> &
  Partial<Pick<Doubt, "id" | "viewerCount" | "helperCount" | "resolved" | "needFasterMethod" | "mySolveTime">>;

type DoubtsState = {
  items: Doubt[];
  /** Tracks whether initial fetch from API has completed. */
  fetched: boolean;
};

const initialState: DoubtsState = {
  items: [],
  fetched: false,
};

const doubtsSlice = createSlice({
  name: "doubts",
  initialState,
  reducers: {
    /** Replace all doubts (from API fetch). */
    setDoubts(state, action: PayloadAction<Doubt[]>) {
      state.items = action.payload;
      state.fetched = true;
    },
    /** Append from Post Doubt or Socket.io event. */
    addDoubt(state, action: PayloadAction<AddDoubtInput>) {
      const p = action.payload;
      // Avoid duplicates (Socket.io + API race)
      if (state.items.some((d) => d.id === p.id)) return;
      const doubt: Doubt = {
        id: p.id ?? nanoid(),
        authorId: p.authorId,
        authorName: p.authorName,
        authorInitials: p.authorInitials,
        exam: p.exam,
        subject: p.subject,
        title: p.title,
        preview: p.preview,
        createdAt: new Date().toISOString(),
        viewerCount: p.viewerCount ?? 0,
        helperCount: p.helperCount ?? 0,
        urgent: p.urgent,
        resolved: p.resolved ?? false,
        needFasterMethod: p.needFasterMethod ?? false,
        mySolveTime: p.mySolveTime ?? null,
      };
      state.items.unshift(doubt);
    },
    /** Partial update from Socket.io (helper count, resolved, etc.). */
    patchDoubt(
      state,
      action: PayloadAction<{ id: string; [key: string]: unknown }>,
    ) {
      const { id, ...patch } = action.payload;
      const d = state.items.find((x) => x.id === id);
      if (d) {
        Object.assign(d, patch);
      }
    },
    /** Optimistic demo when someone taps Help Now */
    registerHelp(state, action: PayloadAction<string>) {
      const d = state.items.find((x) => x.id === action.payload);
      if (d) {
        d.helperCount += 1;
        d.viewerCount += 1;
      }
    },
    /** Remove a doubt (e.g. resolved). */
    removeDoubt(state, action: PayloadAction<string>) {
      state.items = state.items.filter((d) => d.id !== action.payload);
    },
  },
});

export const { addDoubt, setDoubts, patchDoubt, registerHelp, removeDoubt } =
  doubtsSlice.actions;
export default doubtsSlice.reducer;
