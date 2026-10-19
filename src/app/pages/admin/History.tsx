import { useState, useEffect } from "react";
import {
  History as HistoryIcon, Search, Filter, Trash2,
  BookOpen, Layers, Library, Users, BookMarked, Settings,
  Plus, Pencil, CheckCircle2, XCircle, RotateCcw, Save,
  Clock,
} from "lucide-react";
import { loadHistory, ActivityRecord, ActivityModule, ActivityAction } from "../../utils/activityHistory";

const moduleIcons: Record<ActivityModule, React.ElementType> = {
  Buku: BookOpen,
  Kategori: Layers,
  Rak: Library,
  Anggota: Users,
  Peminjaman: BookMarked,
  Pengaturan: Settings,
};

const moduleColors: Record<ActivityModule, string> = {
  Buku: "bg-blue-500/20 text-blue-400",
  Kategori: "bg-purple-500/20 text-purple-400",
  Rak: "bg-cyan-500/20 text-cyan-400",
  Anggota: "bg-amber-500/20 text-amber-400",
  Peminjaman: "bg-emerald-500/20 text-emerald-400",
  Pengaturan: "bg-slate-500/20 text-slate-400",
};

const actionColors: Record<ActivityAction, string> = {
  Tambah: "bg-emerald-500/20 text-emerald-400",
  Edit: "bg-blue-500/20 text-blue-400",
  Hapus: "bg-rose-500/20 text-rose-400",
  Setujui: "bg-emerald-500/20 text-emerald-400",
  Tolak: "bg-rose-500/20 text-rose-400",
  Kembalikan: "bg-orange-500/20 text-orange-400",
  Konfirmasi: "bg-emerald-500/20 text-emerald-400",
  Simpan: "bg-blue-500/20 text-blue-400",
};

const moduleOptions: ActivityModule[] = ["Buku", "Kategori", "Rak", "Anggota", "Peminjaman", "Pengaturan"];
const actionOptions: ActivityAction[] = ["Tambah", "Edit", "Hapus", "Setujui", "Tolak", "Kembalikan", "Konfirmasi", "Simpan"];

function formatDateTime(isoStr: string) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function timeAgo(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDateTime(isoStr);
}

function groupByDate(records: ActivityRecord[]) {
  const groups: Record<string, ActivityRecord[]> = {};
  for (const rec of records) {
    const key = new Date(rec.timestamp).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(rec);
  }
  return groups;
}

export function AdminHistory() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState<ActivityModule | "Semua">("Semua");
  const [filterAction, setFilterAction] = useState<ActivityAction | "Semua">("Semua");
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setRecords(loadHistory());
  }, []);

  const filtered = records.filter((r) => {
    const matchSearch =
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.adminName.toLowerCase().includes(search.toLowerCase()) ||
      r.adminEmail.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === "Semua" || r.module === filterModule;
    const matchAction = filterAction === "Semua" || r.action === filterAction;
    return matchSearch && matchModule && matchAction;
  });

  const grouped = groupByDate(filtered);

  const handleClearHistory = () => {
    localStorage.removeItem("perpus_activity_history");
    setRecords([]);
    setShowClearModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Clear confirmation modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowClearModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-rose-400" />
            </div>
            <h3 className="text-white text-lg font-bold text-center mb-2">Hapus Semua Riwayat?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Semua riwayat aktivitas akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors border border-white/10"
              >
                Batal
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-slate-400 text-sm">Riwayat Aktivitas</p>
          <h1 className="text-white text-2xl font-bold">Log Aktivitas Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/20 px-4 py-2 text-blue-400 text-sm font-medium">
            <HistoryIcon size={16} /> {records.length} Aktivitas
          </span>
          {records.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-2 text-rose-400 text-sm font-medium hover:bg-rose-500/20 transition"
            >
              <Trash2 size={14} /> Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl bg-slate-900 p-5 shadow-sm border border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Cari aktivitas, nama admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value as any)}
              className="px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="Semua">Semua Modul</option>
              {moduleOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as any)}
              className="px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="Semua">Semua Aksi</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <HistoryIcon size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-semibold">
            {records.length === 0 ? "Belum ada riwayat aktivitas" : "Tidak ada aktivitas yang cocok"}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {records.length === 0
              ? "Riwayat akan muncul setelah admin melakukan perubahan data"
              : "Coba ubah filter atau kata kunci pencarian"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {date}
                </div>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-slate-500 text-xs">{items.length} aktivitas</span>
              </div>

              <div className="space-y-2 ml-2 border-l-2 border-white/5 pl-6">
                {items.map((rec) => {
                  const ModIcon = moduleIcons[rec.module] || BookOpen;
                  const modColor = moduleColors[rec.module] || "bg-slate-500/20 text-slate-400";
                  const actColor = actionColors[rec.action] || "bg-slate-500/20 text-slate-400";

                  return (
                    <div
                      key={rec.id}
                      className="relative bg-slate-900 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors group"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-8 top-5 w-3 h-3 rounded-full bg-slate-800 border-2 border-white/10 group-hover:border-blue-500/50 transition-colors" />

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Module icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${modColor}`}>
                          <ModIcon size={18} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${actColor}`}>
                              {rec.action}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${modColor}`}>
                              {rec.module}
                            </span>
                          </div>
                          <p className="text-white text-sm" style={{ fontWeight: 500 }}>
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-slate-500 text-xs">
                              oleh <span className="text-slate-400 font-medium">{rec.adminName}</span>
                            </span>
                            <span className="text-slate-600 text-xs">•</span>
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Clock size={10} /> {timeAgo(rec.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
