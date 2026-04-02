import { NextResponse } from "next/server";

const apiBase = () => process.env.AUTH_API_URL ?? "http://127.0.0.1:4000";

/**
 * Proxies registration to the Express API so the browser never needs a public API URL.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const res = await fetch(`${apiBase()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not reach registration service. Is the backend running on port 4000?",
      },
      { status: 503 },
    );
  }
}
