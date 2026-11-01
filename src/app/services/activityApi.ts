import { apiClient } from "./apiClient";

export type ActivityModule = "Buku" | "Kategori" | "Rak" | "Anggota" | "Peminjaman" | "Pengaturan";
export type ActivityAction =
  | "Tambah"
  | "Edit"
  | "Hapus"
  | "Setujui"
  | "Tolak"
  | "Kembalikan"
  | "Konfirmasi"
  | "Simpan";

export interface ActivityRecord {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  module: ActivityModule;
  action: ActivityAction;
  description: string;
}

export const activityApi = {
  async list(): Promise<ActivityRecord[]> {
    const res = await apiClient.get<ActivityRecord[]>("activity");
    return res.success && res.data ? res.data : [];
  },

  async add(
    module: ActivityModule,
    action: ActivityAction,
    description: string
  ): Promise<boolean> {
    const res = await apiClient.post("activity", { module, action, description });
    return res.success;
  },

  async clear(): Promise<boolean> {
    const res = await apiClient.delete("activity");
    return res.success;
  },
};
