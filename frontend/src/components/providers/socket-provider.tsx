"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAppDispatch } from "@/store/hooks";
import { setOnlineStats } from "@/store/slices/onlineUsersSlice";
import { addDoubt, patchDoubt } from "@/store/slices/doubtsSlice";
import { incrementUnread } from "@/store/slices/notificationsSlice";
import { initialsFromName } from "@/lib/initials";

/**
 * Connects to Socket.io when authenticated, syncs live feed events to Redux.
 */
export function SocketProvider() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status !== "authenticated") return;

    const userId = session?.user?.id;
    const socket = getSocket(userId);

    socket.on("presence", (data: { totalOnline: number; activeHelpers: number }) => {
      dispatch(setOnlineStats(data));
    });

    socket.on("doubt:new", (doubt: Record<string, unknown>) => {
      dispatch(
        addDoubt({
          id: doubt.id as string,
          authorId: doubt.authorId as string,
          authorName: doubt.authorName as string,
          authorInitials: initialsFromName((doubt.authorName as string) ?? ""),
          exam: doubt.exam as string,
          subject: doubt.subject as string,
          title: doubt.title as string,
          preview: doubt.preview as string,
          urgent: doubt.urgent as boolean,
          resolved: (doubt.resolved as boolean) ?? false,
          viewerCount: (doubt.viewerCount as number) ?? 0,
          helperCount: (doubt.helperCount as number) ?? 0,
        }),
      );
    });

    socket.on("doubt:update", (data: { id: string; [key: string]: unknown }) => {
      dispatch(patchDoubt(data));
    });

    // New thread notification (someone started helping your doubt)
    socket.on("thread:new", () => {
      dispatch(incrementUnread());
    });

    // New message notification (when not on messages page)
    socket.on("message:new", () => {
      if (!window.location.pathname.startsWith("/messages")) {
        dispatch(incrementUnread());
      }
    });

    return () => {
      socket.off("presence");
      socket.off("doubt:new");
      socket.off("doubt:update");
      socket.off("thread:new");
      socket.off("message:new");
      disconnectSocket();
    };
  }, [status, session?.user?.id, dispatch]);

  return null;
}
