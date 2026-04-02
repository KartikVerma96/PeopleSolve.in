import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";

import type { AppDispatch, RootState } from "@/store";

/** Typed Redux hooks — use throughout the app instead of plain `useDispatch` / `useSelector`. */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
