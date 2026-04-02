"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { initialsFromName } from "@/lib/initials";
import { useAppDispatch } from "@/store/hooks";
import {
  setCurrentUser,
  type CurrentUserState,
} from "@/store/slices/currentUserSlice";

/** Redux default when signed out (matches pre-sync guest). */
const UNAUTH_USER: CurrentUserState = {
  id: "guest-local",
  name: "Guest",
  initials: "G",
  karma: 0,
};

/**
 * Keeps `currentUser` in Redux aligned with NextAuth so Post Doubt and feed
 * attribution use real names / ids after sign-in (including guest sessions).
 */
export function SessionToReduxSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      dispatch(setCurrentUser(UNAUTH_USER));
      return;
    }

    if (status !== "authenticated" || !session?.user) return;

    const u = session.user;
    const name =
      u.name?.trim() ||
      (u.email ? u.email.split("@")[0] : null)?.replace(/\./g, " ") ||
      "User";

    dispatch(
      setCurrentUser({
        id: u.id,
        name,
        initials: initialsFromName(name),
        karma: typeof u.karma === "number" ? u.karma : 0,
      }),
    );
  }, [dispatch, session, status]);

  return null;
}
