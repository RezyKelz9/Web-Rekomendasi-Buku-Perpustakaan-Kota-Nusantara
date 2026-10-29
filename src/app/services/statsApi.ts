import { apiClient } from "./apiClient";

export interface LibraryStats {
  totalBooks: number;
  availableBooks: number;
  totalCategories: number;
  totalShelves: number;
  totalMembers: number;
  totalLoans: number;
  activeLoans: number;
}

const EMPTY_STATS: LibraryStats = {
  totalBooks: 0,
  availableBooks: 0,
  totalCategories: 0,
  totalShelves: 0,
  totalMembers: 0,
  totalLoans: 0,
  activeLoans: 0,
};

export const statsApi = {
  async fetch(): Promise<LibraryStats> {
    const res = await apiClient.get<LibraryStats>("stats/index.php");
    return res.success && res.data ? res.data : EMPTY_STATS;
  },
};
