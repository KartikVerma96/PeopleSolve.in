const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type FetchOptions = RequestInit & { timeout?: number };

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { timeout = 10_000, ...init } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeout),
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// --- Doubts ---

export type ApiDoubt = {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  exam: string;
  subject: string;
  title: string;
  preview: string;
  imageUrl: string | null;
  urgent: boolean;
  resolved: boolean;
  viewerCount: number;
  helperCount: number;
  threadCount: number;
  createdAt: string;
};

export type DoubtsResponse = {
  items: ApiDoubt[];
  nextCursor: string | null;
};

export function fetchDoubts(params?: {
  q?: string;
  exam?: string;
  subject?: string;
  cursor?: string;
}): Promise<DoubtsResponse> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.exam) sp.set("exam", params.exam);
  if (params?.subject) sp.set("subject", params.subject);
  if (params?.cursor) sp.set("cursor", params.cursor);
  const qs = sp.toString();
  return apiFetch(`/doubts${qs ? `?${qs}` : ""}`);
}

export type ApiDoubtDetail = {
  id: string;
  authorId: string;
  exam: string;
  subject: string;
  title: string;
  description: string;
  imageUrl: string | null;
  urgent: boolean;
  resolved: boolean;
  viewerCount: number;
  helperCount: number;
  threadCount: number;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null; karma: number };
  authorName: string | null;
  authorKarma: number;
};

export function fetchDoubt(id: string): Promise<ApiDoubtDetail> {
  return apiFetch(`/doubts/${id}`);
}

export function createDoubt(body: {
  authorId: string;
  exam: string;
  subject: string;
  title: string;
  description: string;
  urgent: boolean;
  imageUrl?: string | null;
}): Promise<ApiDoubt> {
  return apiFetch("/doubts", { method: "POST", body: JSON.stringify(body) });
}

export function resolveDoubt(
  doubtId: string,
  authorId: string,
): Promise<{ id: string; resolved: boolean }> {
  return apiFetch(`/doubts/${doubtId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ authorId }),
  });
}

// --- Threads ---

export type ApiThreadMember = {
  userId: string;
  name: string | null;
  image: string | null;
  role: string;
};

export type ApiThread = {
  id: string;
  doubt: {
    id: string;
    title: string;
    exam: string;
    subject: string;
    resolved: boolean;
  };
  members: ApiThreadMember[];
  lastMessage: {
    id: string;
    body: string;
    senderName: string | null;
    senderId: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string | null;
  senderImage: string | null;
  body: string;
  createdAt: string;
};

export function createThread(
  doubtId: string,
  helperId: string,
): Promise<{ thread: ApiThread & { doubtTitle: string }; created: boolean }> {
  return apiFetch("/threads", {
    method: "POST",
    body: JSON.stringify({ doubtId, helperId }),
  });
}

export function fetchThreads(
  userId: string,
): Promise<{ threads: ApiThread[] }> {
  return apiFetch(`/threads?userId=${encodeURIComponent(userId)}`);
}

export function fetchMessages(
  threadId: string,
  cursor?: string,
): Promise<{ messages: ApiMessage[]; hasMore: boolean }> {
  const qs = cursor ? `?cursor=${cursor}` : "";
  return apiFetch(`/threads/${threadId}/messages${qs}`);
}

export function sendMessage(
  threadId: string,
  senderId: string,
  body: string,
): Promise<ApiMessage> {
  return apiFetch(`/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ senderId, body }),
  });
}

// --- Upload ---

export async function uploadImage(file: File): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Upload failed");
  }

  return res.json() as Promise<{ url: string }>;
}

export { API_BASE };
