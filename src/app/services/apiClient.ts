const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost/perpustakaan-api/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

let backendAvailable: boolean | null = null;

function getAuthToken(): string | null {
  try {
    const session = localStorage.getItem("perpus_session");
    if (session) {
      const user = JSON.parse(session);
      return user.authToken || null;
    }
  } catch {}
  return null;
}

export async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${API_BASE}/books/index.php`, {
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
  const config: RequestInit = {
    headers,
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch {
    return { success: false, message: "Gagal terhubung ke server." };
  }
}

export const apiClient = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "GET" }),

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

  /** For login endpoint (no auth token needed) */
  postPublic: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
