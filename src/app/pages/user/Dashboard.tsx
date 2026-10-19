import { Link } from "react-router";
import { useState, useEffect } from "react";
import { BookOpen, Star, MapPin, Clock, ArrowRight, TrendingUp, Users, BookMarked } from "lucide-react";
import { categories as staticCategories, shelves, books as staticBooks } from "../../data/libraryData";
import { getAvailableBooks } from "../../utils/bookAvailability";

const USERS_KEY = "perpus_users";

const heroImage = "https://images.unsplash.com/photo-1709159057304-2f4d5c9fb37e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

export function Dashboard() {
  const [books, setBooks] = useState(getAvailableBooks());
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setBooks(getAvailableBooks());

    const counts: Record<string, number> = {};
    staticCategories.forEach((c) => { counts[c.id] = 0; });
    staticBooks.forEach((b) => { counts[b.categoryId] = (counts[b.categoryId] || 0) + 1; });
    setCatCounts(counts);

    const handleStorageChange = () => {
      setBooks(getAvailableBooks());
    };
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      setBooks(getAvailableBooks());
    }, 3000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const recommended = books.filter((b) => b.recommended);
  const available = books.filter((b) => b.available);

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const memberCount = users.filter((u: any) => u.role === "member").length;

  const stats = [
    { label: "Total Buku", value: String(available.length), icon: BookOpen, color: "bg-sky-100 text-sky-700" },
    { label: "Kategori", value: String(staticCategories.length), icon: BookMarked, color: "bg-indigo-100 text-indigo-700" },
    { label: "Rak Buku", value: String(shelves.length), icon: MapPin, color: "bg-cyan-100 text-cyan-700" },
    { label: "Anggota Aktif", value: String(memberCount), icon: Users, color: "bg-blue-100 text-blue-700" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div
        className="relative rounded-2xl overflow-hidden h-52 lg:h-64 flex items-end"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c3558]/90 via-[#0c3558]/50 to-transparent" />
        <div className="relative z-10 p-6 lg:p-8 text-white">
          <p className="text-sky-300 text-sm mb-1">Selamat Datang di</p>
          <h1 className="text-2xl lg:text-3xl text-white" style={{ fontWeight: 700 }}>
            Perpustakaan Kota Nusantara
          </h1>
          <p className="text-white/70 text-sm mt-1">Temukan buku favoritmu dan mulai petualangan membaca hari ini!</p>
          <Link
            to="/user/books"
            className="mt-4 inline-flex items-center gap-2 bg-sky-400 text-sky-900 px-4 py-2 rounded-xl text-sm hover:bg-sky-300 transition-colors"
            style={{ fontWeight: 600 }}
          >
            Jelajahi Buku <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-sky-900 text-lg" style={{ fontWeight: 700 }}>{s.value}</p>
              <p className="text-sky-500 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Books */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-sky-600" />
            <h2 className="text-sky-900" style={{ fontWeight: 700 }}>Buku Rekomendasi</h2>
          </div>
          <Link to="/user/books" className="text-sky-600 text-sm hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {recommended.map((book) => {
            const category = staticCategories.find((c) => c.id === book.categoryId);
            const shelf = shelves.find((s) => s.id === book.shelfId);
            return (
              <Link
                key={book.id}
                to={`/user/books?id=${book.id}&category=${book.categoryId}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-100 hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${book.available ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`} style={{ fontWeight: 500 }}>
                    {book.available ? "Tersedia" : "Dipinjam"}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sky-900 text-xs leading-tight line-clamp-2" style={{ fontWeight: 600 }}>{book.title}</p>
                  <p className="text-sky-500 text-xs mt-0.5 truncate">{book.author}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sky-700 text-xs" style={{ fontWeight: 600 }}>{book.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={10} className="text-sky-400" />
                    <span className="text-sky-400 text-xs">{shelf?.name} – {book.shelfPosition}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Categories Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-sky-600" />
            <h2 className="text-sky-900" style={{ fontWeight: 700 }}>Kategori Buku</h2>
          </div>
          <Link to="/user/categories" className="text-sky-600 text-sm hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {staticCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/user/books?category=${cat.id}`}
              className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 hover:shadow-md transition-all hover:-translate-y-1 text-center"
            >
              <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${cat.color}`}>
                <BookOpen size={20} />
              </div>
              <p className="text-sky-900 text-xs" style={{ fontWeight: 600 }}>{cat.name}</p>
              <p className="text-sky-400 text-xs mt-0.5">{catCounts[cat.id] || 0} buku</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Available Books Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sky-100 text-sm">Siap Dipinjam Sekarang</p>
          <p className="text-white text-2xl mt-0.5" style={{ fontWeight: 700 }}>{available.length} Buku Tersedia</p>
          <p className="text-sky-200 text-sm mt-1">Kunjungi perpustakaan dan pinjam buku favoritmu hari ini.</p>
        </div>
        <Link
          to="/user/books"
          className="bg-white text-sky-700 px-5 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition-colors flex-shrink-0"
          style={{ fontWeight: 600 }}
        >
          Cari Buku
        </Link>
      </div>

      {/* Loan Duration Quick Info */}
      <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-sky-600" />
          <h2 className="text-sky-900" style={{ fontWeight: 700 }}>Info Peminjaman Cepat</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Anggota Umum", days: "7 hari", color: "border-sky-300 bg-sky-50" },
            { label: "Pelajar/Mahasiswa", days: "14 hari", color: "border-indigo-300 bg-indigo-50" },
            { label: "Buku Referensi", days: "3 hari", color: "border-rose-300 bg-rose-50" },
            { label: "Guru/Dosen", days: "30 hari", color: "border-green-300 bg-green-50" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 border ${item.color}`}>
              <p className="text-sky-900 text-xs" style={{ fontWeight: 600 }}>{item.label}</p>
              <p className="text-sky-700 text-sm mt-0.5" style={{ fontWeight: 700 }}>{item.days}</p>
            </div>
          ))}
        </div>
        <Link to="/user/loan-info" className="mt-3 inline-flex items-center gap-1 text-sky-600 text-sm hover:underline">
          Lihat detail aturan <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
