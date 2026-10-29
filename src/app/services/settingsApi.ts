import { apiClient } from "./apiClient";
import type { LibrarySettings } from "../utils/loanUtils";
import type { LoanRule } from "../data/libraryData";

export const DEFAULT_SETTINGS: LibrarySettings = {
  durasiUmum: 7,
  durasiPelajar: 14,
  durasiDosen: 90,
  dendaUmum: 4000,
  dendaPelajar: 1000,
  dendaDosen: 0,
  dendaBukuFavorit: 2000,
  batasBukuUmum: 2,
  batasBukuPelajar: 3,
  batasBukuDosen: 5,
};

export const settingsApi = {
  async fetch(): Promise<LibrarySettings> {
    const res = await apiClient.get<LibrarySettings>("settings/index.php");
    return res.success && res.data ? { ...DEFAULT_SETTINGS, ...res.data } : DEFAULT_SETTINGS;
  },

  async save(settings: LibrarySettings): Promise<{ success: boolean; message?: string }> {
    const res = await apiClient.put("settings/index.php", settings);
    return { success: res.success, message: res.message };
  },

  async fetchLoanRules(): Promise<LoanRule[]> {
    const res = await apiClient.get<LoanRule[]>("loan-rules/index.php");
    return res.success && res.data ? res.data : [];
  },
};
