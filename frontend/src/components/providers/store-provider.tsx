"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { persistor, store } from "@/store";

type StoreProviderProps = {
  children: React.ReactNode;
};

/**
 * Redux + Persist. `PersistGate` with `null` loading avoids a blocking splash;
 * UI still hydrates from server HTML, then rehydrates persisted state on the client.
 */
export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
