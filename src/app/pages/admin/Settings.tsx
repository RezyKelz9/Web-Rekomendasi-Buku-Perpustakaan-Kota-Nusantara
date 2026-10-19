import { useState, useEffect } from "react";
import { SlidersHorizontal, Shield, Users, Save, CheckCircle2, Heart, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { addActivity } from "../../utils/activityHistory";
import { loadSettings, saveSettings, LibrarySettings } from "../../utils/loanUtils";

export function AdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<LibrarySettings>(loadSettings);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    setTimeout(() => {
      saveSettings(settings);
      setLoading(false);
      setSuccess(true);
      if (user) {
        addActivity(
          user.namaLengkap,
          user.email,
          "Pengaturan",
          "Simpan",
          `Memperbarui ketentuan peminjaman & denda (Umum: ${settings.durasiUmum}h/Rp${settings.dendaUmum}, Pelajar: ${settings.durasiPelajar}h/Rp${settings.dendaPelajar}, Dosen: ${settings.durasiDosen}h/Rp${settings.dendaDosen}, Buku Favorit: Rp${settings.dendaBukuFavorit})`
        );
      }
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  const formatRp = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-slate-400 text-sm">Pengaturan Sistem</p>
            <h1 className="text-white text-2xl font-bold">Ketentuan & Kebijakan</h1>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">Terhubung ke Sistem Peminjaman</span>
          </div>
        </div>

        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 text-emerald-400 animate-in fade-in">
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">Pengaturan berhasil disimpan & langsung berlaku!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-8">
          {/* Section 1: Jangka Waktu Peminjaman */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal size={18} className="text-blue-400" />
              <h2 className="text-lg font-bold text-white">Jangka Waktu Peminjaman</h2>
            </div>
            <p className="text-slate-500 text-xs mb-4 ml-7">Durasi max peminjaman per jenis anggota (hari)</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Umum</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="durasiUmum"
                    value={settings.durasiUmum}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                  <span className="text-slate-500 text-xs whitespace-nowrap">hari</span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pelajar</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="durasiPelajar"
                    value={settings.durasiPelajar}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                  <span className="text-slate-500 text-xs whitespace-nowrap">hari</span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Dosen</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="durasiDosen"
                    value={settings.durasiDosen}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                  <span className="text-slate-500 text-xs whitespace-nowrap">hari</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Denda Keterlambatan per Jenis Anggota */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={18} className="text-blue-400" />
              <h2 className="text-lg font-bold text-white">Denda Keterlambatan per Jenis Anggota</h2>
            </div>
            <p className="text-slate-500 text-xs mb-4 ml-7">Tarif denda per hari keterlambatan (Rp). Atur 0 untuk tanpa denda.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Denda Umum</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Rp</span>
                  <input
                    type="number"
                    name="dendaUmum"
                    value={settings.dendaUmum}
                    onChange={handleChange}
                    min={0}
                    step={500}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                  <span className="text-slate-500 text-xs whitespace-nowrap">/hari</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-2">{formatRp(settings.dendaUmum)}/hari</p>
              </div>
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Denda Pelajar</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Rp</span>
                  <input
                    type="number"
                    name="dendaPelajar"
                    value={settings.dendaPelajar}
                    onChange={handleChange}
                    min={0}
                    step={500}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                  <span className="text-slate-500 text-xs whitespace-nowrap">/hari</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-2">{formatRp(settings.dendaPelajar)}/hari</p>
              </div>
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Denda Dosen</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Rp</span>
                  <input
                    type="number"
                    name="dendaDosen"
                    value={settings.dendaDosen}
                    onChange={handleChange}
                    min={0}
                    step={500}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                  <span className="text-slate-500 text-xs whitespace-nowrap">/hari</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-2">
                  {settings.dendaDosen === 0 ? "Tanpa denda (grace period)" : `${formatRp(settings.dendaDosen)}/hari`}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Denda Buku Favorit */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={18} className="text-rose-400" />
              <h2 className="text-lg font-bold text-white">Denda Buku Favorit</h2>
            </div>
            <p className="text-slate-500 text-xs mb-4 ml-7">Denda tambahan per hari untuk buku berlabel "Favorit" (ditambah ke denda anggota)</p>
            <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4 max-w-sm">
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tambahan Denda Buku Favorit</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">Rp</span>
                <input
                  type="number"
                  name="dendaBukuFavorit"
                  value={settings.dendaBukuFavorit}
                  onChange={handleChange}
                  min={0}
                  step={500}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                />
                <span className="text-slate-500 text-xs whitespace-nowrap">/hari</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-2">{formatRp(settings.dendaBukuFavorit)}/hari (di atas denda anggota)</p>
            </div>
          </div>

          {/* Section 4: Batas Maksimal Buku */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-blue-400" />
              <h2 className="text-lg font-bold text-white">Batas Maksimal Buku Dipinjam</h2>
            </div>
            <p className="text-slate-500 text-xs mb-4 ml-7">Jumlah maksimum buku yang bisa dipinjam secara bersamaan</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Umum</label>
                <input
                  type="number"
                  name="batasBukuUmum"
                  value={settings.batasBukuUmum}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                />
              </div>
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pelajar</label>
                <input
                  type="number"
                  name="batasBukuPelajar"
                  value={settings.batasBukuPelajar}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                />
              </div>
              <div className="rounded-2xl bg-slate-800/50 border border-white/5 p-4">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Dosen</label>
                <input
                  type="number"
                  name="batasBukuDosen"
                  value={settings.batasBukuDosen}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                />
              </div>
            </div>
          </div>

          {/* Ringkasan */}
          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-blue-400" />
              <h3 className="text-blue-300 text-sm font-bold">Ringkasan Ketentuan</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full" />
                <span className="text-slate-400">Umum: <span className="text-white font-semibold">{settings.durasiUmum} hari</span> · {formatRp(settings.dendaUmum)}/hari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                <span className="text-slate-400">Pelajar: <span className="text-white font-semibold">{settings.durasiPelajar} hari</span> · {formatRp(settings.dendaPelajar)}/hari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="text-slate-400">Dosen: <span className="text-white font-semibold">{settings.durasiDosen} hari</span> · {settings.dendaDosen === 0 ? "Tanpa denda" : `${formatRp(settings.dendaDosen)}/hari`}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-rose-400 rounded-full" />
              <span className="text-slate-400">Buku Favorit: <span className="text-rose-300 font-semibold">+{formatRp(settings.dendaBukuFavorit)}/hari</span> (di atas denda anggota)</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3.5 text-white font-bold hover:bg-blue-400 transition disabled:bg-blue-500/40"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Simpan & Terapkan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
