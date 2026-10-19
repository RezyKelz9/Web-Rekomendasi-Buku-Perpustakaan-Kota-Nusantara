import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  User,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Settings,
  Edit2,
  Calendar,
  Hash,
  Mail,
  Phone,
  MapPin,
  Star,
  AlertCircle,
  LogOut,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  X,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { loadLoansForUser, saveLoansForUser, formatLoanDate, getRemainingDays, calculateFine, getOverdueDays, LoanRecord } from "../../utils/loanUtils";
import { loanApi } from "../../services/loanApi";
import { RatingWidget } from "../../components/RatingWidget";
import { submitRating, getUserRating } from "../../utils/ratingUtils";

const tabs = ["Profil", "Pinjaman Aktif", "Riwayat", "Pengaturan"];

export function Account() {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Profil");
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeLoansData, setActiveLoansData] = useState<LoanRecord[]>([]);
  const [loanHistory, setLoanHistory] = useState<LoanRecord[]>([]);

  // Ubah Kata Sandi state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!pwForm.current) { setPwError("Kata sandi lama wajib diisi."); return; }
    if (!pwForm.newPw) { setPwError("Kata sandi baru wajib diisi."); return; }
    if (pwForm.newPw.length < 6) { setPwError("Kata sandi baru minimal 6 karakter."); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("Konfirmasi kata sandi tidak cocok."); return; }
    if (pwForm.current === pwForm.newPw) { setPwError("Kata sandi baru tidak boleh sama dengan yang lama."); return; }
    setPwLoading(true);
    setTimeout(() => {
      const result = changePassword(pwForm.current, pwForm.newPw);
      if (result.success) {
        setPwSuccess(result.message);
        setPwForm({ current: "", newPw: "", confirm: "" });
        setTimeout(() => { setPwSuccess(""); setShowPasswordForm(false); }, 2000);
      } else {
        setPwError(result.message);
      }
      setPwLoading(false);
    }, 400);
  };
  const [formData, setFormData] = useState({
    namaLengkap: user?.namaLengkap ?? "",
    email: user?.email ?? "",
    nomorHP: user?.nomorHP ?? "",
    alamat: user?.alamat ?? "",
  });

  useEffect(() => {
    if (!user) return;
    const loans = loadLoansForUser(user.id);
    setActiveLoansData(loans.filter((loan) => loan.status === "Dipinjam" || loan.status === "Menunggu" || loan.status === "Dikembalikan"));
    setLoanHistory(loans.filter((loan) => loan.status === "Selesai" || loan.status === "Ditolak"));
  }, [user]);

  const handleReturnBook = async (loanId: string) => {
    if (!user) return;
    const apiId = loanApi.extractNumericId(loanId);
    await loanApi.updateStatus(apiId, "return");
    const loans = loadLoansForUser(user.id);
    const updated = loans.map((l) => {
      if (l.id === loanId) {
        const overdue = getOverdueDays(l.dueDate);
        const fine = calculateFine(user?.jenisAnggota || "Umum", overdue, l.isFavorite);
        return { ...l, status: "Dikembalikan" as const, fine, paymentStatus: fine > 0 ? "unpaid" as const : "paid" as const, returnDate: new Date().toISOString() };
      }
      return l;
    });
    saveLoansForUser(user.id, updated);
    setActiveLoansData(updated.filter((loan) => loan.status === "Dipinjam" || loan.status === "Menunggu" || loan.status === "Dikembalikan"));
    setLoanHistory(updated.filter((loan) => loan.status === "Selesai" || loan.status === "Ditolak"));
  };

  const userInitial = user?.namaLengkap?.charAt(0).toUpperCase() ?? "?";
  const memberId = user?.memberCode || (user?.id ? `ID-${user.id.slice(-6).toUpperCase()}` : "—");
  const memberSince = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const totalFines = activeLoansData.reduce((acc, loan) => {
    if (loan.status === "Dipinjam" || loan.status === "Dikembalikan") {
      const overdue = getOverdueDays(loan.dueDate);
      const fine = calculateFine(user?.jenisAnggota || "Umum", overdue, loan.isFavorite);
      if (loan.status === "Dikembalikan" && loan.paymentStatus === "paid") return acc;
      return acc + fine;
    }
    return acc;
  }, 0);

  const handleSave = () => {
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate("/select-role");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-sky-900 text-2xl" style={{ fontWeight: 700 }}>Akun Saya</h1>
        <p className="text-sky-500 text-sm mt-1">Kelola profil dan pantau aktivitas peminjaman Anda</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#0c3558] to-sky-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-20 h-20 bg-sky-400 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-sky-900 text-3xl" style={{ fontWeight: 700 }}>{userInitial}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-white text-xl" style={{ fontWeight: 700 }}>{user?.namaLengkap ?? "—"}</h2>
              <span className="text-xs bg-sky-400 text-sky-900 px-2.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                {user?.jenisAnggota ?? "Anggota"}
              </span>
            </div>
            <p className="text-sky-200 text-sm">{memberId}</p>
            <p className="text-sky-300 text-xs mt-0.5">{user?.email ?? ""}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { value: loanHistory.length, label: "Dibaca" },
              { value: activeLoansData.length, label: "Aktif" },
              { value: totalFines > 0 ? `Rp ${totalFines.toLocaleString("id-ID")}` : "Rp 0", label: "Denda" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-white text-xl" style={{ fontWeight: 700 }}>{stat.value}</p>
                <p className="text-sky-300 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-sky-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${activeTab === tab ? "bg-white text-sky-900 shadow-sm" : "text-sky-600 hover:text-sky-800"}`}
            style={{ fontWeight: activeTab === tab ? 600 : 400 }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Profil */}
      {activeTab === "Profil" && (
        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sky-900" style={{ fontWeight: 700 }}>Informasi Pribadi</h3>
            <button
              onClick={editMode ? handleSave : () => setEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors ${editMode ? "bg-sky-600 text-white" : "border border-sky-200 text-sky-700 hover:bg-sky-50"}`}
              style={{ fontWeight: 500 }}
            >
              {editMode ? <><Save size={14} /> Simpan</> : <><Edit2 size={14} /> Edit</>}
            </button>
          </div>

          {saved && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
              <CheckCircle size={15} />
              Perubahan berhasil disimpan.
            </div>
          )}

          <div className="space-y-4">
            {[
              { icon: User, label: "Nama Lengkap", key: "namaLengkap" },
              { icon: Mail, label: "Email", key: "email" },
              { icon: Phone, label: "Nomor HP", key: "nomorHP" },
              { icon: MapPin, label: "Alamat", key: "alamat" },
            ].map(({ icon: Icon, label, key }) => (
              <div key={key} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-sky-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sky-500 text-xs">{label}</p>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData[key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  ) : (
                    <p className="text-sky-900 text-sm mt-0.5" style={{ fontWeight: 500 }}>
                      {formData[key as keyof typeof formData] || <span className="text-slate-300 italic">Belum diisi</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-sky-100">
            <h3 className="text-sky-900 mb-4" style={{ fontWeight: 700 }}>Info Keanggotaan</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Hash, label: "ID Anggota", value: memberId },
                { icon: User, label: "Jenis Anggota", value: user?.jenisAnggota ?? "—" },
                { icon: Calendar, label: "Bergabung Sejak", value: memberSince },
                { icon: Clock, label: "Status", value: "Aktif" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-sky-50 rounded-xl p-3 flex items-start gap-2">
                  <Icon size={14} className="text-sky-500 mt-0.5" />
                  <div>
                    <p className="text-sky-400 text-xs">{label}</p>
                    <p className="text-sky-900 text-xs mt-0.5" style={{ fontWeight: 600 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pinjaman Aktif */}
      {activeTab === "Pinjaman Aktif" && (
        <div className="space-y-4">
          {activeLoansData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-10 text-center">
              <BookOpen size={48} className="text-sky-200 mx-auto mb-3" />
              <p className="text-sky-600" style={{ fontWeight: 600 }}>Tidak ada pinjaman aktif</p>
            </div>
          ) : (
            activeLoansData.map((loan) => {
              const remainingDays = getRemainingDays(loan.dueDate);
              return (
                <div
                  key={loan.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 ${remainingDays <= 3 ? "border-rose-200" : "border-sky-100"}`}
                >
                  <div className="flex gap-4">
                    <img src={loan.cover} alt={loan.title} className="w-16 h-20 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sky-900" style={{ fontWeight: 700 }}>{loan.title}</p>
                          <p className="text-sky-500 text-sm">{loan.author}</p>
                        </div>
                        {loan.status === "Dikembalikan" ? (
                          <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 bg-amber-100 text-amber-700" style={{ fontWeight: 500 }}>
                            {loan.fine > 0 && loan.paymentStatus !== "paid" ? "Menunggu Pembayaran" : "Menunggu Konfirmasi"}
                          </span>
                        ) : loan.status === "Menunggu" ? (
                          <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 bg-sky-100 text-sky-700" style={{ fontWeight: 500 }}>
                            Menunggu Persetujuan
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${remainingDays <= 3 ? "bg-rose-100 text-rose-700" : "bg-green-100 text-green-700"}`}
                            style={{ fontWeight: 500 }}
                          >
                            {remainingDays <= 3 ? "Segera Jatuh Tempo" : "Tepat Waktu"}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-sky-400" />
                          <p className="text-sky-600 text-sm">Jatuh tempo: <span style={{ fontWeight: 600 }}>{formatLoanDate(loan.dueDate)}</span></p>
                        </div>
                        {loan.status === "Dipinjam" && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} className={remainingDays <= 3 ? "text-rose-400" : "text-sky-400"} />
                            <p className={`text-sm ${remainingDays <= 3 ? "text-rose-600" : "text-sky-600"}`}>
                              Sisa <span style={{ fontWeight: 600 }}>{Math.max(remainingDays, 0)} hari</span>
                            </p>
                          </div>
                        )}
                      </div>
                      {remainingDays <= 3 && loan.status === "Dipinjam" && (
                        <div className="mt-3 flex items-center gap-2 text-rose-600 bg-rose-50 rounded-xl p-2">
                          <AlertCircle size={14} />
                          <p className="text-xs">Segera kembalikan untuk menghindari denda.</p>
                        </div>
                      )}
                      {remainingDays < 0 && loan.status === "Dipinjam" && (() => {
                        const overdue = getOverdueDays(loan.dueDate);
                        const fine = calculateFine(user?.jenisAnggota || "Umum", overdue, loan.isFavorite);
                        return fine > 0 ? (
                          <div className="mt-3 flex items-center gap-2 text-rose-600 bg-rose-50 rounded-xl p-2">
                            <AlertCircle size={14} />
                            <div className="text-xs">
                              <p style={{ fontWeight: 600 }}>Terlambat {overdue} hari — Denda: Rp {fine.toLocaleString("id-ID")}</p>
                              {loan.isFavorite && <p className="text-rose-400 text-[10px] mt-0.5">Termasuk tambahan denda Buku Favorit</p>}
                            </div>
                          </div>
                        ) : null;
                      })()}
                      {loan.status === "Dipinjam" && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleReturnBook(loan.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs rounded-xl hover:bg-sky-700 transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                             Kembalikan Buku
                          </button>
                        </div>
                      )}
                      {loan.status === "Dikembalikan" && loan.fine > 0 && loan.paymentStatus !== "paid" && (
                        <div className="mt-3">
                          <button
                            onClick={() => navigate(`/payment/${loan.id}`)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs rounded-xl hover:bg-rose-700 transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            <CreditCard size={14} /> Bayar Denda Rp {loan.fine.toLocaleString("id-ID")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="bg-sky-50 rounded-2xl border border-sky-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-sky-600" />
            </div>
            <div>
              <p className="text-sky-800 text-sm" style={{ fontWeight: 600 }}>Slot Pinjaman Tersisa</p>
              <p className="text-sky-500 text-xs">Anda dapat meminjam <span className="text-sky-700" style={{ fontWeight: 700 }}>1 buku lagi</span> (maks. 3 buku)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Riwayat */}
      {activeTab === "Riwayat" && (
        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-sky-50">
            <h3 className="text-sky-900" style={{ fontWeight: 700 }}>Riwayat Peminjaman</h3>
            <p className="text-sky-500 text-sm mt-0.5">Total {loanHistory.filter(l => l.status !== "Ditolak").length} buku pernah dipinjam</p>
          </div>
          <div className="divide-y divide-sky-50">
            {loanHistory.length === 0 ? (
              <div className="p-6 text-center text-sky-600">Belum ada riwayat peminjaman.</div>
            ) : (
              loanHistory.map((loan) => (
                <div key={loan.id} className="flex items-center gap-4 p-4">
                  {loan.status === "Ditolak" ? (
                    <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <XCircle size={18} className="text-rose-500" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={18} className="text-green-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sky-900 text-sm truncate" style={{ fontWeight: 600 }}>{loan.title}</p>
                    <p className="text-sky-500 text-xs">{loan.author}</p>
                    {loan.status === "Ditolak" ? (
                      <span className="inline-flex items-center gap-1 text-rose-500 text-xs mt-0.5 font-semibold">
                        <XCircle size={12} /> Ditolak
                      </span>
                    ) : (
                      <p className="text-sky-400 text-xs mt-0.5">Dikembalikan: {formatLoanDate(loan.dueDate)}</p>
                    )}
                  </div>
                  {loan.status === "Selesai" && user ? (
                    <RatingWidget
                      userId={user.id}
                      loanId={loan.id}
                      initialRating={getUserRating(user.id, loan.id)}
                      onRate={(rating) => submitRating(user.id, loan.id, rating)}
                      size={14}
                    />
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Pengaturan */}
      {activeTab === "Pengaturan" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-sky-600" />
              <h3 className="text-sky-900" style={{ fontWeight: 700 }}>Notifikasi</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Ingatkan 3 hari sebelum jatuh tempo", defaultOn: true },
                { label: "Notifikasi buku baru tersedia", defaultOn: true },
                { label: "Info kegiatan perpustakaan", defaultOn: false },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between">
                  <p className="text-sky-700 text-sm">{n.label}</p>
                  <ToggleSwitch defaultOn={n.defaultOn} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} className="text-sky-600" />
              <h3 className="text-sky-900" style={{ fontWeight: 700 }}>Keamanan & Akses</h3>
            </div>

            {/* Tombol trigger */}
            {!showPasswordForm && (
              <button
                onClick={() => { setShowPasswordForm(true); setPwError(""); setPwSuccess(""); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-sky-100 text-sky-700 text-sm hover:bg-sky-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={15} className="text-sky-500" />
                  Ubah Kata Sandi
                </span>
                <span className="text-sky-400">→</span>
              </button>
            )}

            {/* Form ubah kata sandi */}
            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <KeyRound size={15} className="text-sky-500" />
                    <span className="text-sky-900 text-sm" style={{ fontWeight: 600 }}>Ubah Kata Sandi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordForm(false); setPwError(""); setPwSuccess(""); setPwForm({ current: "", newPw: "", confirm: "" }); }}
                    className="text-slate-400 hover:text-sky-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {pwError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl px-3 py-2">
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-3 py-2 flex items-center gap-2">
                    <CheckCircle size={13} /> {pwSuccess}
                  </div>
                )}

                {(["current", "newPw", "confirm"] as const).map((key) => {
                  const labels = { current: "Kata Sandi Lama", newPw: "Kata Sandi Baru", confirm: "Konfirmasi Kata Sandi Baru" };
                  return (
                    <div key={key}>
                      <label className="block text-sky-700 text-xs mb-1" style={{ fontWeight: 500 }}>{labels[key]}</label>
                      <div className="relative">
                        <input
                          type={showPw[key] ? "text" : "password"}
                          value={pwForm[key]}
                          onChange={(e) => { setPwForm({ ...pwForm, [key]: e.target.value }); setPwError(""); }}
                          placeholder={key === "current" ? "Masukkan kata sandi lama" : key === "newPw" ? "Minimal 6 karakter" : "Ulangi kata sandi baru"}
                          className="w-full px-3 py-2.5 pr-10 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors"
                        >
                          {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {pwLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Save size={14} /> Simpan Kata Sandi</>
                  }
                </button>
              </form>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl border-2 border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
            style={{ fontWeight: 600 }}
          >
            <LogOut size={16} />
            Keluar dari Akun
          </button>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-sky-500" : "bg-sky-200"}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}