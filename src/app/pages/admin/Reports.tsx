import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, TrendingUp, BookOpen, Users } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { loadLoans } from "../../utils/loanUtils";
import { books as staticBooks, categories } from "../../data/libraryData";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function AdminReports() {
  const navigate = useNavigate();
  const [popularBook, setPopularBook] = useState({ title: "Belum ada data", count: 0 });
  const [popularCategory, setPopularCategory] = useState({ name: "Belum ada data", count: 0 });
  const [trend, setTrend] = useState({ text: "Belum ada data", sub: "Dibanding bulan lalu" });
  const [monthlyData, setMonthlyData] = useState<{ month: string; peminjaman: number }[]>([]);
  const [totalLoans, setTotalLoans] = useState(0);

  useEffect(() => {
    const allLoans = loadLoans();
    const loans = allLoans.filter((l) => l.status !== "Ditolak");
    setTotalLoans(loans.length);

    // --- Most borrowed book ---
    const bookCount = new Map<string, number>();
    loans.forEach((l) => bookCount.set(l.bookId, (bookCount.get(l.bookId) || 0) + 1));
    let topBookId = "";
    let topBookCount = 0;
    bookCount.forEach((count, bookId) => {
      if (count > topBookCount) { topBookCount = count; topBookId = bookId; }
    });
    const topBook = staticBooks.find((b) => b.id === topBookId);
    setPopularBook(topBook ? { title: topBook.title, count: topBookCount } : { title: "Belum ada data", count: 0 });

    // --- Most popular category ---
    const catCount = new Map<string, number>();
    loans.forEach((l) => {
      const book = staticBooks.find((b) => b.id === l.bookId);
      if (book) catCount.set(book.categoryId, (catCount.get(book.categoryId) || 0) + 1);
    });
    let topCatId = "";
    let topCatCount = 0;
    catCount.forEach((count, catId) => {
      if (count > topCatCount) { topCatCount = count; topCatId = catId; }
    });
    const topCat = categories.find((c) => c.id === topCatId);
    setPopularCategory(topCat ? { name: topCat.name, count: topCatCount } : { name: "Belum ada data", count: 0 });

    // --- Monthly trend (last 6 months) ---
    const now = new Date();
    const months: { month: string; peminjaman: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const count = loans.filter((l) => {
        const ld = new Date(l.borrowDate);
        return ld.getMonth() === m && ld.getFullYear() === y;
      }).length;
      months.push({ month: MONTH_NAMES[m], peminjaman: count });
    }
    setMonthlyData(months);

    // --- Trend percentage ---
    const thisMonth = loans.filter((l) => {
      const d = new Date(l.borrowDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = loans.filter((l) => {
      const d = new Date(l.borrowDate);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    if (lastMonth === 0 && thisMonth === 0) {
      setTrend({ text: "Belum ada data", sub: "Dibanding bulan lalu" });
    } else if (lastMonth === 0) {
      setTrend({ text: `${thisMonth} peminjaman`, sub: "Bulan ini" });
    } else {
      const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
      const arrow = pct >= 0 ? "Naik" : "Turun";
      setTrend({ text: `${arrow} ${Math.abs(pct)}%`, sub: "Dibanding bulan lalu" });
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-slate-400 text-sm">Laporan & Analitik</p>
            <h1 className="text-white text-2xl font-bold">Tren Peminjaman</h1>
          </div>
          <button className="rounded-2xl bg-blue-500 px-5 py-3 text-white text-sm hover:bg-blue-400 transition font-semibold">
            Download Laporan
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 mt-6">
          <div className="rounded-3xl border border-white/10 bg-slate-800/50 p-5">
            <p className="text-slate-400 text-sm">Paling Sering Dipinjam</p>
            <div className="mt-4 flex items-center gap-4">
              <BookOpen size={24} className="text-blue-400" />
              <div>
                <p className="text-white font-semibold">{popularBook.title}</p>
                <p className="text-slate-400 text-sm">{popularBook.count} peminjaman</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-800/50 p-5">
            <p className="text-slate-400 text-sm">Kategori Terpopuler</p>
            <div className="mt-4 flex items-center gap-4">
              <Users size={24} className="text-blue-400" />
              <div>
                <p className="text-white font-semibold">{popularCategory.name}</p>
                <p className="text-slate-400 text-sm">{popularCategory.count} peminjaman</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-800/50 p-5">
            <p className="text-slate-400 text-sm">Tren Bulanan</p>
            <div className="mt-4 flex items-center gap-4">
              <TrendingUp size={24} className="text-blue-400" />
              <div>
                <p className="text-white font-semibold">{trend.text}</p>
                <p className="text-slate-400 text-sm">{trend.sub}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 p-6 shadow-sm border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-sm">Analisis</p>
            <h2 className="text-white text-lg font-bold">Grafik Peminjaman 6 Bulan Terakhir</h2>
          </div>
          <button onClick={() => navigate("/admin/loans")} className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/20 px-4 py-2 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors cursor-pointer">
            <BarChart3 size={16} /> Total: {totalLoans} peminjaman
          </button>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} barSize={40}>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
              labelStyle={{ color: "#94a3b8" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number) => [`${value} peminjaman`, "Jumlah"]}
            />
            <Bar dataKey="peminjaman" radius={[8, 8, 0, 0]}>
              {monthlyData.map((_, index) => (
                <Cell
                  key={index}
                  fill={index === monthlyData.length - 1 ? "#3b82f6" : "#1e40af"}
                />
              ))}
            </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-slate-400 text-sm mt-4">
          Data ini dapat menjadi bahan evaluasi untuk akurasi rekomendasi Collaborative Filtering.
        </p>
      </div>
    </div>
  );
}
