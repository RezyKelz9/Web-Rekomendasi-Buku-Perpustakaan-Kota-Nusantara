import { apiClient } from "./apiClient";

export const LEGACY_KEYS = {
  users: "perpus_users",
  books: "admin_books_data",
  loans: "perpus_loans",
  ratings: "perpus_ratings",
  settings: "librarySettings",
  activities: "perpus_activity_history",
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export interface LegacyPayload {
  users: unknown[];
  books: unknown[];
  loans: unknown[];
  ratings: unknown[];
  settings: Record<string, unknown> | null;
  activities: unknown[];
}

export function hasLegacyData(): boolean {
  return Object.values(LEGACY_KEYS).some((key) => {
    const value = localStorage.getItem(key);
    if (!value) return false;
    if (key === LEGACY_KEYS.activities) {
      try {
        return JSON.parse(value).length > 0;
      } catch {
        return false;
      }
    }
    return true;
  });
}

export function buildLegacyPayload(): LegacyPayload {
  const settings = readJson<Record<string, unknown> | null>(LEGACY_KEYS.settings, null);
  return {
    users: readJson<unknown[]>(LEGACY_KEYS.users, []),
    books: readJson<unknown[]>(LEGACY_KEYS.books, []),
    loans: readJson<unknown[]>(LEGACY_KEYS.loans, []),
    ratings: readJson<unknown[]>(LEGACY_KEYS.ratings, []),
    settings,
    activities: readJson<unknown[]>(LEGACY_KEYS.activities, []),
  };
}

export async function submitLegacyMigration(payload: LegacyPayload) {
  return apiClient.post<{
    users: { imported: number; skipped: number; pendingPassword: number };
    books: { imported: number; skipped: number };
    loans: { imported: number; skipped: number; failed: number };
    ratings: { imported: number; skipped: number };
    activities: { imported: number; skipped: number };
    settings: boolean;
    warnings: string[];
  }>("migration-local-data", payload);
}

export function clearLegacyData() {
  Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("perpus_session");
  localStorage.removeItem("admin_books_data");
}
