import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

import currentUserReducer from "@/store/slices/currentUserSlice";
import doubtsReducer from "@/store/slices/doubtsSlice";
import notificationsReducer from "@/store/slices/notificationsSlice";
import onlineUsersReducer from "@/store/slices/onlineUsersSlice";
import uiReducer from "@/store/slices/uiSlice";

/**
 * Avoid localStorage during SSR / server pre-render (redux-persist default storage).
 */
const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      };

const rootReducer = combineReducers({
  ui: uiReducer,
  doubts: doubtsReducer,
  notifications: notificationsReducer,
  currentUser: currentUserReducer,
  onlineUsers: onlineUsersReducer,
});

const persistConfig = {
  key: "peoplesolve",
  version: 2,
  storage,
  whitelist: ["ui", "currentUser", "onlineUsers"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
