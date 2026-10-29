import { useEffect, useState } from "react";
import { Database, AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import {
  buildLegacyPayload,
  clearLegacyData,
  hasLegacyData,
  submitLegacyMigration,
  type LegacyPayload,
} from "../../services/legacyMigrationApi";

interface MigrationResult {
  users: { imported: number; skipped: number; pendingPassword: number };
  books: { imported: number; skipped: number };
  loans: { imported: number; skipped: number; failed: number };
  ratings: { imported: number; skipped: number };
  activities: { imported: number; skipped: number };
  settings: boolean;
  warnings: string[];
}

const EMPTY: MigrationResult = {
  users: { imported: 0, skipped: 0, pendingPassword: 0 },
  books: { imported: 0, skipped: 0 },
  loans: { imported: 0, skipped: 0, failed: 0 },
  ratings: { imported: 0, skipped: 0 },
  activities: { imported: 0, skipped: 0 },
  settings: false,
  warnings: [],
};

export function MigrateLocal() {
  const [available, setAvailable] = useState(false);
  const [payload, setPayload] = useState<LegacyPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const hasData = hasLegacyData();
    setAvailable(hasData);
    if (hasData) setPayload(buildLegacyPayload());
  }, []);

  const handleMigrate = async () => {
    if (!payload) return;
    setSubmitting(true);
    setError("");
    const res = await submitLegacyMigration(payload);
    if (res.success && res.data) {
      setResult(res.data);
      setAvailable(hasLegacyData());
    } else {
      setError(res.message || "Migrasi gagal dijalankan.");
    }
    setSubmitting(false);
  };

  const handleClear = () => {
    clearLegacyData();
    setAvailable(false);
    setPayload(null);
  };

  const counts = result ?? EMPTY;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 border border-white/10">
        <div className="flex items-center gap-3">
          <Database size={24} className="text-blue-400" />
          <div>
            <p className="text-slate-400 text-sm">Utilitas Sekali Pakai</p>
            <h1 className="text-white text-2xl font-bold">Migrasi Data localStorage</h1>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-4 max-w-3xl">
          Pindahkan data lama (anggota, buku, peminjaman, rating, riwayat aktivitas, dan pengaturan) dari localStorage
          browser ke PostgreSQL. Data yang sudah ada di PostgreSQL tidak akan ditimpa.
        </p>
      </div>

      {!available && !result && (
        <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-emerald-400 text-sm">
          Tidak ada data localStorage lama yang perlu dimigrasikan.
        </div>
      )}

      {payload && !result && (
        <div className="rounded-3xl bg-slate-900 p-6 border border-white/10 space-y-4">
          <h2 className="text-white font-bold">Data yang terdeteksi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Anggota: <span className="text-white font-semibold">{payload.users.length}</span></div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Buku: <span className="text-white font-semibold">{payload.books.length}</span></div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Peminjaman: <span className="text-white font-semibold">{payload.loans.length}</span></div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Rating: <span className="text-white font-semibold">{payload.ratings.length}</span></div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Riwayat: <span className="text-white font-semibold">{payload.activities.length}</span></div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Pengaturan: <span className="text-white font-semibold">{payload.settings ? "Ada" : "Tidak ada"}</span></div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-400 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <button
            onClick={handleMigrate}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-white text-sm font-semibold hover:bg-blue-400 disabled:bg-blue-500/40 transition"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            {submitting ? "Memigrasikan..." : "Mulai Migrasi"}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-3xl bg-slate-900 p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={20} />
            <h2 className="font-bold">Migrasi selesai</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Anggota masuk: <span className="text-white font-semibold">{counts.users.imported}</span> · dilewati: {counts.users.skipped}</div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Buku masuk: <span className="text-white font-semibold">{counts.books.imported}</span> · dilewati: {counts.books.skipped}</div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Peminjaman masuk: <span className="text-white font-semibold">{counts.loans.imported}</span> · gagal: {counts.loans.failed}</div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Rating masuk: <span className="text-white font-semibold">{counts.ratings.imported}</span></div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Riwayat masuk: <span className="text-white font-semibold">{counts.activities.imported}</span></div>
            <div className="rounded-xl bg-slate-800 p-4 text-slate-300">Pengaturan: <span className="text-white font-semibold">{counts.settings ? "Dimigrasikan" : "Tidak ada"}</span></div>
          </div>
          {counts.users.pendingPassword > 0 && (
            <p className="text-amber-400 text-sm">
              {counts.users.pendingPassword} akun memakai kata sandi lama dan perlu diatur ulang saat login berikutnya.
            </p>
          )}
          {counts.warnings.length > 0 && (
            <ul className="list-disc list-inside text-amber-400 text-sm space-y-1">
              {counts.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {available && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-5 py-3 text-rose-400 text-sm font-semibold hover:bg-rose-500/10 transition"
            >
              <Trash2 size={16} /> Hapus Data localStorage Lama
            </button>
          )}
        </div>
      )}
    </div>
  );
}
