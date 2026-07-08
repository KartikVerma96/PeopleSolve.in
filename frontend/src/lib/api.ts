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
  needFasterMethod: boolean;
  mySolveTime: string | null;
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
  mySolveTime: string | null;
  needFasterMethod: boolean;
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
  mySolveTime?: string;
  needFasterMethod?: boolean;
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

// --- Answers ---

export type ApiAnswer = {
  id: string;
  doubtId: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  authorKarma: number;
  authorVerified: boolean;
  approachName: string | null;
  oneLinerTrick: string | null;
  quickSolution: string;
  detailedExplanation: string | null;
  solveTime: string | null;
  examTags: string | null;
  upvotes: number;
  downvotes: number;
  userVote: number;
  rating: number | null;
  ratingCount: number;
  createdAt: string;
};

export function fetchAnswers(
  doubtId: string,
  userId?: string,
): Promise<{ answers: ApiAnswer[] }> {
  const qs = userId ? `&userId=${encodeURIComponent(userId)}` : "";
  return apiFetch(`/answers?doubtId=${encodeURIComponent(doubtId)}${qs}`);
}

export function postAnswer(body: {
  doubtId: string;
  authorId: string;
  approachName?: string;
  oneLinerTrick?: string;
  quickSolution: string;
  detailedExplanation?: string;
  solveTime?: string;
  examTags?: string;
}): Promise<ApiAnswer> {
  return apiFetch("/answers", { method: "POST", body: JSON.stringify(body) });
}

export type ApiTrick = {
  id: string;
  approachName: string | null;
  oneLinerTrick: string | null;
  quickSolution: string;
  solveTime: string | null;
  examTags: string | null;
  rating: number;
  ratingCount: number;
  authorName: string | null;
  authorKarma: number;
  authorVerified: boolean;
  doubt: { id: string; title: string; exam: string; subject: string };
};

export function fetchTricks(params?: {
  exam?: string;
  subject?: string;
  q?: string;
}): Promise<{ tricks: ApiTrick[] }> {
  const sp = new URLSearchParams();
  if (params?.exam) sp.set("exam", params.exam);
  if (params?.subject) sp.set("subject", params.subject);
  if (params?.q) sp.set("q", params.q);
  const qs = sp.toString();
  return apiFetch(`/answers/tricks${qs ? `?${qs}` : ""}`);
}

export function voteAnswer(
  answerId: string,
  userId: string,
  value: number,
): Promise<{ upvotes: number; downvotes: number; userVote: number }> {
  return apiFetch(`/answers/${answerId}/vote`, {
    method: "POST",
    body: JSON.stringify({ userId, value }),
  });
}

export function rateAnswer(
  answerId: string,
  raterId: string,
  rating: number,
): Promise<{ rating: number; count: number }> {
  return apiFetch(`/answers/${answerId}/rate`, {
    method: "POST",
    body: JSON.stringify({ raterId, rating }),
  });
}

// --- Payments ---

export type CreateOrderResponse = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  helperName: string | null;
  keyId: string;
};

export function createPaymentOrder(body: {
  fromUserId: string;
  toUserId: string;
  threadId?: string;
  amountInr: number;
  note?: string;
}): Promise<CreateOrderResponse> {
  return apiFetch("/payments/create-order", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyPayment(body: {
  paymentId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}): Promise<{ success: boolean }> {
  return apiFetch("/payments/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type PaymentHistoryItem = {
  id: string;
  amount: number;
  helperAmount: number;
  platformFee: number;
  note: string | null;
  direction: "sent" | "received";
  otherUser: { id: string; name: string | null };
  createdAt: string;
};

export function fetchPaymentHistory(
  userId: string,
): Promise<{ payments: PaymentHistoryItem[] }> {
  return apiFetch(`/payments/history?userId=${encodeURIComponent(userId)}`);
}

// --- Users ---

export function updateUserProfile(
  userId: string,
  data: { upiId?: string; name?: string },
): Promise<{ id: string; name: string | null; upiId: string | null }> {
  return apiFetch(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function fetchUserProfile(
  userId: string,
): Promise<{
  id: string;
  name: string | null;
  upiId: string | null;
  karma: number;
  doubtsPosted: number;
  tipsReceived: number;
  totalEarned: number;
  createdAt: string;
}> {
  return apiFetch(`/users/${userId}`);
}

export { API_BASE };
