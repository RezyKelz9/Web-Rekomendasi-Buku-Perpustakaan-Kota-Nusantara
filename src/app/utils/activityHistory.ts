export type ActivityModule = "Buku" | "Kategori" | "Rak" | "Anggota" | "Peminjaman" | "Pengaturan";

export type ActivityAction = "Tambah" | "Edit" | "Hapus" | "Setujui" | "Tolak" | "Kembalikan" | "Konfirmasi" | "Simpan";

export interface ActivityRecord {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  module: ActivityModule;
  action: ActivityAction;
  description: string;
}

const HISTORY_KEY = "perpus_activity_history";

export function loadHistory(): ActivityRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(records: ActivityRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

export function addActivity(
  adminName: string,
  adminEmail: string,
  module: ActivityModule,
  action: ActivityAction,
  description: string,
) {
  const records = loadHistory();
  const newRecord: ActivityRecord = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    adminName,
    adminEmail,
    module,
    action,
    description,
  };
  records.unshift(newRecord);
  if (records.length > 500) records.length = 500;
  saveHistory(records);
}
