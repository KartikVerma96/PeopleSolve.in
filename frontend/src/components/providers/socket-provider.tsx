"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { getSocket } from "@/lib/socket";
import { useToast } from "@/components/ui/toast";
import { useAppDispatch } from "@/store/hooks";
import { setOnlineStats } from "@/store/slices/onlineUsersSlice";
import { addDoubt, patchDoubt } from "@/store/slices/doubtsSlice";
import { incrementUnread } from "@/store/slices/notificationsSlice";
import { initialsFromName } from "@/lib/initials";

/**
 * Connects to Socket.io when authenticated, syncs live feed events to Redux
 * and shows in-app toast notifications.
 */
export function SocketProvider() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  useEffect(() => {
    if (status !== "authenticated") return;

    const userId = session?.user?.id;
    const socket = getSocket(userId);

    const onPresence = (data: { totalOnline: number; activeHelpers: number }) => {
      dispatch(setOnlineStats(data));
    };

    const onDoubtNew = (doubt: Record<string, unknown>) => {
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
    };

    const onDoubtUpdate = (data: { id: string; [key: string]: unknown }) => {
      dispatch(patchDoubt(data));
    };

    // Someone started helping your doubt
    const onThreadNew = (data: { doubtTitle?: string; helperName?: string }) => {
      dispatch(incrementUnread());
      addToast({
        type: "notification",
        title: "Someone is helping!",
        message: data.helperName
          ? `${data.helperName} started helping with "${data.doubtTitle ?? "your doubt"}"`
          : "A helper joined your doubt thread",
      });
    };

    // New message when not on messages page
    const onMessageNotify = (data: { senderName?: string; preview?: string }) => {
      if (!window.location.pathname.startsWith("/messages")) {
        dispatch(incrementUnread());
        addToast({
          type: "notification",
          title: data.senderName ? `Message from ${data.senderName}` : "New message",
          message: data.preview?.slice(0, 60) ?? "You have a new message",
        });
      }
    };

    socket.on("presence", onPresence);
    socket.on("doubt:new", onDoubtNew);
    socket.on("doubt:update", onDoubtUpdate);
    socket.on("thread:new", onThreadNew);
    socket.on("message:notify", onMessageNotify);

    return () => {
      socket.off("presence", onPresence);
      socket.off("doubt:new", onDoubtNew);
      socket.off("doubt:update", onDoubtUpdate);
      socket.off("thread:new", onThreadNew);
      socket.off("message:notify", onMessageNotify);
    };
  }, [status, session?.user?.id, dispatch, addToast]);

  return null;
}
