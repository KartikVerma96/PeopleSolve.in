"use client";

import { motion } from "framer-motion";
import { Globe2, ArrowRightToLine } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ICON_STROKE } from "@/lib/icon-style";

type LoginFormProps = {
  /** Passed from server: Google OAuth is configured in `.env.local`. */
  showGoogle: boolean;
};

/**
 * Sign-in options: guest (no account), demo email/password, optional Google.
 * Full email registration will use the backend when it exists.
 */
export function LoginForm({ showGoogle }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const registered = searchParams.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending("credentials");
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setPending(null);
    if (res?.error) {
      setError("Invalid email or password. Try the demo account below.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function onGuest() {
    setError(null);
    setPending("guest");
    await signIn("guest", { callbackUrl: "/" });
    setPending(null);
  }

  async function onGoogle() {
    setError(null);
    setPending("google");
    await signIn("google", { callbackUrl: "/" });
    setPending(null);
  }

  if (status === "loading") {
    return (
      <p className="text-center text-muted-foreground text-sm">Loading…</p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto w-full max-w-md space-y-8"
    >
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Sign in
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          No paywall — guest, Google (if configured), email/password via the API,
          or the offline demo account.
        </p>
        {registered && (
          <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-emerald-700 text-sm dark:text-emerald-200/95">
            Account created. Sign in with your email and password below.
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-card/50 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <Button
          type="button"
          className="h-11 w-full rounded-xl font-semibold"
          disabled={!!pending}
          onClick={onGuest}
        >
          {pending === "guest" ? "…" : "Continue as guest"}
        </Button>

        {showGoogle && (
          <>
            <div className="relative py-1">
              <Separator className="bg-border dark:bg-white/10" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider">
                or
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl font-medium"
              disabled={!!pending}
              onClick={onGoogle}
            >
              <Globe2 className="mr-2 size-4" strokeWidth={ICON_STROKE} />
              {pending === "google" ? "Redirecting…" : "Continue with Google"}
            </Button>
          </>
        )}

        <div className="relative py-1">
          <Separator className="bg-border dark:bg-white/10" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider">
            demo
          </span>
        </div>

        <form onSubmit={onCredentials} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@peoplesolve.dev"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="h-10"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-[12px] text-muted-foreground dark:bg-white/[0.04]">
            Offline demo (no DB):{" "}
            <code className="text-foreground/90">demo@peoplesolve.dev</code> /{" "}
            <code className="text-foreground/90">demo</code>
            {" — "}
            With MySQL + seed, the same credentials use the database.
          </p>
          <Button
            type="submit"
            variant="secondary"
            className="h-11 w-full rounded-xl font-semibold"
            disabled={!!pending}
          >
            <ArrowRightToLine className="mr-2 size-4" strokeWidth={ICON_STROKE} />
            {pending === "credentials" ? "Signing in…" : "Sign in with email"}
          </Button>
        </form>
      </div>

      <p className="text-center text-[13px] text-muted-foreground">
        <span className="mr-2">New here?</span>
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
        <span className="mx-2 text-muted-foreground/60">·</span>
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Live feed
        </Link>
      </p>
    </motion.div>
  );
}
