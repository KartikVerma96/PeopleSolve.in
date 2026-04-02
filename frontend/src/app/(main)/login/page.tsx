import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const showGoogle = Boolean(
    process.env.AUTH_GOOGLE_ID?.length &&
      process.env.AUTH_GOOGLE_SECRET?.length,
  );

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center py-8">
      <Suspense
        fallback={
          <p className="text-center text-muted-foreground text-sm">Loading…</p>
        }
      >
        <LoginForm showGoogle={showGoogle} />
      </Suspense>
    </div>
  );
}
