import { BookOpen, Users, Book, AlertTriangle, BarChart3, Clock, TrendingUp, Banknote } from "lucide-react";
import { loadLoans, getRemainingDays, calculateFine, getOverdueDays } from "../../utils/loanUtils";
import { books as staticBooks, categories } from "../../data/libraryData";
import { authApi } from "../../services/api";
import { useEffect, useState } from "react";

interface NotifItem {
  type: "warning" | "info" | "danger";
  title: string;
  desc: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState([
    { label: "Total Buku", value: "0", icon: BookOpen, color: "bg-blue-500/20 text-blue-400" },
    { label: "Total Anggota", value: "0", icon: Users, color: "bg-emerald-500/20 text-emerald-400" },
    { label: "Sedang Dipinjam", value: "0", icon: Book, color: "bg-amber-500/20 text-amber-400" },
    { label: "Terlambat", value: "0", icon: AlertTriangle, color: "bg-rose-500/20 text-rose-400" },
  ]);
  const [totalFines, setTotalFines] = useState(0);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [popularBook, setPopularBook] = useState("Belum ada data");
  const [popularCategory, setPopularCategory] = useState("Belum ada data");
  const [loanTrend, setLoanTrend] = useState("Belum ada data");
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
    try {
      const users = await authApi.fetchUsers();
      const memberCount = users.filter((u: any) => u.role === "member").length;
      const loans = loadLoans();
      const allBooks = staticBooks;

      const totalBuku = allBooks.length;
      const dipinjam = loans.filter((l) => l.status === "Dipinjam" || l.status === "Dikembalikan").length;
      const terlambat = loans.filter(
        (l) => (l.status === "Dipinjam" || l.status === "Dikembalikan") && getRemainingDays(l.dueDate) < 0
      ).length;

      const computedTotalFines = loans.reduce((acc, l) => {
        if (l.status === "Dipinjam" || l.status === "Dikembalikan") {
          const overdue = getOverdueDays(l.dueDate);
          return acc + calculateFine(l.userType || "Umum", overdue, l.isFavorite);
        }
        return acc;
      }, 0);
      setTotalFines(computedTotalFines);

      const counts: Record<string, number> = {};
      categories.forEach((c) => { counts[c.id] = 0; });
      allBooks.forEach((b) => { counts[b.categoryId] = (counts[b.categoryId] || 0) + 1; });
      setCatCounts(counts);

      setStats([
        { label: "Total Buku", value: String(totalBuku), icon: BookOpen, color: "bg-blue-500/20 text-blue-400" },
        { label: "Total Anggota", value: String(memberCount), icon: Users, color: "bg-emerald-500/20 text-emerald-400" },
        { label: "Sedang Dipinjam", value: String(dipinjam), icon: Book, color: "bg-amber-500/20 text-amber-400" },
        { label: "Terlambat", value: String(terlambat), icon: AlertTriangle, color: "bg-rose-500/20 text-rose-400" },
      ]);

      // Notifications
      const notifs: NotifItem[] = [];

      const lowStockBooks = allBooks.filter((b) => b.stock <= 1);
      if (lowStockBooks.length > 0) {
        notifs.push({
          type: "warning",
          title: "Buku stok menipis",
          desc: `${lowStockBooks.length} buku memiliki stok rendah (${lowStockBooks.map((b) => b.title).slice(0, 3).join(", ")}${lowStockBooks.length > 3 ? ", ..." : ""}).`,
        });
      }

      const dueSoon = loans.filter((l) => {
        if (l.status !== "Dipinjam") return false;
        const remaining = getRemainingDays(l.dueDate);
        return remaining >= 0 && remaining <= 3;
      });
      if (dueSoon.length > 0) {
        notifs.push({
          type: "info",
          title: "Peminjaman akan jatuh tempo",
          desc: `${dueSoon.length} peminjaman akan jatuh tempo dalam 3 hari ke depan.`,
        });
      }

      if (terlambat > 0) {
        notifs.push({
          type: "danger",
          title: "Peminjaman terlambat",
          desc: `${terlambat} peminjaman sudah melewati batas waktu pengembalian.`,
        });
      }

      const menunggu = loans.filter((l) => l.status === "Menunggu");
      if (menunggu.length > 0) {
        notifs.push({
          type: "info",
          title: "Menunggu persetujuan",
          desc: `${menunggu.length} peminjaman menunggu persetujuan admin.`,
        });
      }

      if (notifs.length === 0) {
        notifs.push({
          type: "info",
          title: "Semua aman",
          desc: "Tidak ada notifikasi saat ini.",
        });
      }

      setNotifications(notifs);

      // Popular book (most borrowed)
      const bookBorrowCount = new Map<string, number>();
      loans.forEach((l) => {
        bookBorrowCount.set(l.bookId, (bookBorrowCount.get(l.bookId) || 0) + 1);
      });
      let maxBorrow = 0;
      let topBookId = "";
      bookBorrowCount.forEach((count, bookId) => {
        if (count > maxBorrow) {
          maxBorrow = count;
          topBookId = bookId;
        }
      });
      const topBook = allBooks.find((b) => b.id === topBookId);
      setPopularBook(topBook ? `${topBook.title} (${maxBorrow}x dipinjam)` : "Belum ada peminjaman");

      // Popular category
      const catCount = new Map<string, number>();
      loans.forEach((l) => {
        const book = allBooks.find((b) => b.id === l.bookId);
        if (book) catCount.set(book.categoryId, (catCount.get(book.categoryId) || 0) + 1);
      });
      let maxCat = 0;
      let topCatId = "";
      catCount.forEach((count, catId) => {
        if (count > maxCat) {
          maxCat = count;
          topCatId = catId;
        }
      });
      const topCat = categories.find((c) => c.id === topCatId);
      setPopularCategory(topCat ? `${topCat.name} (${maxCat}x)` : "Belum ada data");

      // Loan trend
      const now = new Date();
      const thisMonth = loans.filter((l) => {
        const d = new Date(l.borrowDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const lastMonth = loans.filter((l) => {
        const d = new Date(l.borrowDate);
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      });
      if (lastMonth.length === 0 && thisMonth.length === 0) {
        setLoanTrend("Belum ada data");
      } else if (lastMonth.length === 0) {
        setLoanTrend(`${thisMonth.length} peminjaman bulan ini`);
      } else {
        const pct = Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100);
        const arrow = pct >= 0 ? "naik" : "turun";
        setLoanTrend(`${arrow} ${Math.abs(pct)}% dibanding bulan lalu`);
      }
    } catch {}
    })();
  }, []);

  const notifStyles: Record<string, string> = {
    warning: "border-amber-500/20 bg-amber-500/10",
    info: "border-blue-500/20 bg-blue-500/10",
    danger: "border-rose-500/20 bg-rose-500/10",
  };
  const notifTextStyles: Record<string, string> = {
    warning: "text-amber-400",
    info: "text-blue-400",
    danger: "text-rose-400",
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-sm">Ringkasan</p>
                <h1 className="text-white text-2xl font-bold">Dashboard Admin</h1>
              </div>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/20 px-4 py-2 text-blue-400 text-sm">
                <BarChart3 size={16} /> Tren Mingguan
              </span>
            </div>
            <p className="text-slate-400 text-sm">Ikhtisar statistik operasional perpustakaan dan peringatan stok rendah.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {stats.map((item) => (
              <div key={item.label} className="rounded-3xl bg-slate-900 p-5 shadow-sm border border-white/10 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-white text-xl font-bold">{item.value}</p>
                  <p className="text-slate-400 text-sm">{item.label}</p>
                </div>
              </div>
            ))}
            <div className="rounded-3xl bg-slate-900 p-5 shadow-sm border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/20 text-rose-400">
                <Banknote size={20} />
              </div>
              <div>
                <p className="text-white text-xl font-bold">Rp {totalFines.toLocaleString("id-ID")}</p>
                <p className="text-slate-400 text-sm">Total Denda</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm">Notifikasi</p>
              <h2 className="text-white text-lg font-bold">Perhatian Cepat</h2>
            </div>
          </div>
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${notifStyles[n.type]}`}>
                <p className={`text-sm font-semibold ${notifTextStyles[n.type]}`}>{n.title}</p>
                <p className="text-slate-400 text-sm mt-1">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm">Ringkasan Laporan</p>
              <h2 className="text-white text-lg font-bold">Data Populer</h2>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Book size={16} />
              </div>
              <span>Buku paling banyak dipinjam: <strong className="text-white">{popularBook}</strong></span>
            </li>
            <li className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <TrendingUp size={16} />
              </div>
              <span>Kategori paling populer: <strong className="text-white">{popularCategory}</strong></span>
            </li>
            <li className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Clock size={16} />
              </div>
              <span>Tren pinjaman bulan ini: <strong className="text-white">{loanTrend}</strong></span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10">
          <div className="mb-4">
            <p className="text-slate-400 text-sm">Komposisi Buku</p>
            <h2 className="text-white text-lg font-bold">Buku per Kategori</h2>
          </div>
          <div className="space-y-3">
            {categories.map((cat) => {
              const count = catCounts[cat.id] || 0;
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-40 truncate">{cat.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color.split(" ")[0]}`}
                      style={{ width: `${(count / staticBooks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
