import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, FileText, Search, Heart } from "lucide-react";
import { loadLoans, saveLoans, LoanRecord, calculateFine, getOverdueDays } from "../../utils/loanUtils";
import { loanApi } from "../../services/loanApi";
import { useAuth } from "../../context/AuthContext";
import { addActivity } from "../../utils/activityHistory";

const formatDate = (isoStr: string) => {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return isoStr;
  }
};

export function AdminLoans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  useEffect(() => {
    setLoans(loadLoans());
  }, []);

  const loansWithFine = useMemo(() => {
    return loans.map((loan) => {
      if (loan.status === "Dipinjam" || loan.status === "Dikembalikan") {
        const overdue = getOverdueDays(loan.dueDate);
        if (overdue > 0) {
          const computedFine = calculateFine(loan.userType || "Umum", overdue, loan.isFavorite);
          return { ...loan, fine: computedFine };
        }
      }
      return loan;
    });
  }, [loans]);

  const totalFines = useMemo(() => {
    return loansWithFine.reduce((acc, curr) => acc + (curr.fine || 0), 0);
  }, [loansWithFine]);

  const handleAction = async (id: string, action: "approve" | "reject" | "confirm") => {
    const loan = loans.find((l) => l.id === id);
    if (!loan) return;

    const apiId = loanApi.extractNumericId(id);
    const apiAction = action === "confirm" ? "confirm" : action;

    let fine = loan.fine;
    if (action === "confirm") {
      const overdue = getOverdueDays(loan.dueDate);
      if (overdue > 0) {
        fine = calculateFine(loan.userType || "Umum", overdue, loan.isFavorite);
      }
    }

    await loanApi.updateStatus(apiId, apiAction, fine);

    setLoans((prev) => {
      const next = prev.map((loan) => {
        if (loan.id === id) {
          if (action === "approve") {
            const due = new Date();
            due.setDate(due.getDate() + (loan.duration || 7));
            return { ...loan, status: "Dipinjam" as const, dueDate: due.toISOString() };
          }
          if (action === "reject") {
            return { ...loan, status: "Ditolak" as const };
          }
          if (action === "confirm") {
            return { ...loan, status: "Selesai" as const, fine, returnDate: new Date().toISOString() };
          }
        }
        return loan;
      });
      saveLoans(next);
      return next;
    });

    if (user) {
      const actionMap: Record<string, { action: "Setujui" | "Tolak" | "Konfirmasi"; desc: string }> = {
        approve: { action: "Setujui", desc: `Menyetujui peminjaman buku "${loan.title}" oleh ${loan.userName || "Anggota"}` },
        reject: { action: "Tolak", desc: `Menolak peminjaman buku "${loan.title}" oleh ${loan.userName || "Anggota"}` },
        confirm: { action: "Konfirmasi", desc: `Mengkonfirmasi pengembalian buku "${loan.title}" dari ${loan.userName || "Anggota"}` },
      };
      const { action: act, desc } = actionMap[action];
      addActivity(user.namaLengkap, user.email, "Peminjaman", act, desc);
    }
  };

  const filteredLoans = loansWithFine.filter((loan) => {
    const matchesSearch = loan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (loan.userName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Semua" || loan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-slate-400 text-sm">Manajemen Peminjaman</p>
          <h1 className="text-white text-2xl font-bold">Persetujuan & Pengembalian</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
          <p className="text-blue-400 text-sm font-semibold">Menunggu Persetujuan</p>
          <p className="text-white text-3xl font-bold mt-3">
            {loans.filter(l => l.status === "Menunggu").length}
          </p>
        </div>
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-amber-400 text-sm font-semibold">Buku Sedang Dipinjam</p>
          <p className="text-white text-3xl font-bold mt-3">
            {loans.filter(l => l.status === "Dipinjam").length}
          </p>
        </div>
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
          <p className="text-rose-400 text-sm font-semibold">Total Denda Belum Lunas</p>
          <p className="text-white text-3xl font-bold mt-3">
            Rp {totalFines.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Cari nama peminjam atau buku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Dikembalikan">Dikembalikan</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-400 transition">
              <FileText size={16} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 text-slate-400 uppercase tracking-[0.1em] text-[11px] font-bold">
              <tr>
                <th className="px-4 py-3">Peminjam</th>
                <th className="px-4 py-3">Buku</th>
                <th className="px-4 py-3">Tanggal Pengajuan</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Tanggal Pengembalian</th>
                <th className="px-4 py-3">Denda</th>
                <th className="px-4 py-3">Pembayaran</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{loan.userName || "Anggota"}</p>
                    <p className="text-xs text-slate-400">{loan.userType || "Umum"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{loan.title}</span>
                      {loan.isFavorite && (
                        <Heart size={12} className="text-rose-400 fill-rose-400 flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(loan.borrowDate)}</td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(loan.dueDate)}</td>
                  <td className="px-4 py-4 text-slate-400">{formatDate(loan.returnDate)}</td>
                  <td className="px-4 py-4">
                    {loan.fine > 0 ? (
                      <div>
                        <span className="text-rose-400 font-semibold">Rp {loan.fine.toLocaleString("id-ID")}</span>
                        {loan.isFavorite && (
                          <p className="text-[10px] text-rose-400/60 mt-0.5">+ Buku Favorit</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {loan.fine > 0 ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        loan.paymentStatus === "paid"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {loan.paymentStatus === "paid" ? "Lunas" : "Belum Dibayar"}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      loan.status === "Menunggu" ? "bg-amber-500/20 text-amber-400" :
                      loan.status === "Dipinjam" ? "bg-blue-500/20 text-blue-400" :
                      loan.status === "Dikembalikan" ? "bg-orange-500/20 text-orange-400" :
                      loan.status === "Selesai" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-rose-500/20 text-rose-400"
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right space-x-2">
                    {loan.status === "Menunggu" && (
                      <>
                        <button onClick={() => handleAction(loan.id, "approve")} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition tooltip" title="Setujui">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => handleAction(loan.id, "reject")} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition tooltip" title="Tolak">
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                    {loan.status === "Dikembalikan" && (
                      <button
                        onClick={() => handleAction(loan.id, "confirm")}
                        disabled={loan.fine > 0 && loan.paymentStatus !== "paid"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          loan.fine > 0 && loan.paymentStatus !== "paid"
                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-500"
                        }`}
                        title={loan.fine > 0 && loan.paymentStatus !== "paid" ? "Anggota belum membayar denda" : ""}
                      >
                        Konfirmasi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada data peminjaman yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
