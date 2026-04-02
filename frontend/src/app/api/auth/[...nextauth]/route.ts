import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Wrap NextAuth handlers to catch internal errors (e.g. corrupted JWT)
 * and always return valid JSON — prevents the ClientFetchError.
 */
async function safeHandler(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest,
) {
  try {
    return await handler(req);
  } catch (e) {
    console.error("[NextAuth] handler error:", e);
    // Return a valid empty session so the client doesn't crash
    if (req.nextUrl.pathname.endsWith("/session")) {
      return NextResponse.json({});
    }
    return NextResponse.json({ error: "Auth error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return safeHandler(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return safeHandler(handlers.POST, req);
}
