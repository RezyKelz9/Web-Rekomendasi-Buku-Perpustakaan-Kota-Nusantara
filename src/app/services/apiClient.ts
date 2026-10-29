const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  user?: T;
}

let backendAvailable: boolean | null = null;

const SESSION_KEY = "perpus_session";

const AUTH_CHANNEL = "perpus-auth";
let authChannel: BroadcastChannel | null = null;

function getAuthChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!authChannel) authChannel = new BroadcastChannel(AUTH_CHANNEL);
  return authChannel;
}

export function broadcastLogout(token: string | null | undefined) {
  if (!token) return;
  getAuthChannel()?.postMessage({ type: "logout", token });
}

export function onAuthBroadcast(
  handler: (msg: { type: string; token?: string }) => void
): () => void {
  const ch = getAuthChannel();
  if (!ch) return () => {};
  const listener = (ev: MessageEvent) => handler(ev.data);
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

export function getSessionUser<T = Record<string, unknown>>(): T | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: unknown) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function getAuthToken(): string | null {
  const user = getSessionUser<{ authToken?: string }>();
  return user?.authToken || null;
}

export async function checkBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    backendAvailable = res.ok;
    return backendAvailable;
  } catch {
    backendAvailable = false;
    return false;
  }
}

export function isBackendAvailable(): boolean {
  return backendAvailable === true;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}/${endpoint}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (res.status === 401) {
      clearSession();
      broadcastLogout(token);
      window.dispatchEvent(new CustomEvent("perpus:unauthorized"));
    }
    return json;
  } catch {
    return { success: false, message: "Gagal terhubung ke server PostgreSQL." };
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    }),

  postPublic: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
