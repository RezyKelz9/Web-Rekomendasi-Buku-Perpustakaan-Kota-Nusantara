import { useState, useEffect } from "react";
import {
  BookOpen,
  Microscope,
  Landmark,
  Baby,
  TrendingUp,
  Star as StarIcon,
  ArrowRight,
  BookMarked,
} from "lucide-react";
import { Link } from "react-router";
import { fetchCategories, fetchBooks } from "../../services/libraryApi";
import type { Category, Book } from "../../data/libraryData";

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Microscope,
  Landmark,
  Baby,
  TrendingUp,
  Star: StarIcon,
};

const gradients: Record<string, string> = {
  novel: "from-rose-400 to-pink-600",
  science: "from-sky-400 to-blue-600",
  history: "from-amber-400 to-orange-500",
  children: "from-green-400 to-emerald-600",
  selfhelp: "from-purple-400 to-violet-600",
  religion: "from-orange-400 to-red-500",
};

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [categoriesData, booksData] = await Promise.all([
        fetchCategories(),
        fetchBooks(),
      ]);
      setCategories(categoriesData);
      setBooks(booksData);
      setLoading(false);
    }
    loadData();
  }, []);

  const getBooksInCategory = (id: string) => books.filter((b) => b.categoryId === id);

  const totalBooks = books.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sky-500 text-sm">Memuat data kategori...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-sky-900 text-2xl" style={{ fontWeight: 700 }}>Kategori Buku</h1>
        <p className="text-sky-500 text-sm mt-1">Jelajahi koleksi buku berdasarkan kategori</p>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-900 rounded-2xl p-5 mb-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sky-200 text-sm">Total Koleksi Perpustakaan</p>
            <p className="text-white text-3xl mt-1" style={{ fontWeight: 700 }}>{totalBooks} Buku</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-white text-xl" style={{ fontWeight: 700 }}>{categories.length}</p>
              <p className="text-sky-300 text-xs">Kategori</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white text-xl" style={{ fontWeight: 700 }}>{books.filter((b) => b.available).length}</p>
              <p className="text-sky-300 text-xs">Tersedia</p>
            </div>
          </div>
        </div>

        {/* Category Distribution Bar */}
        <div className="mt-4">
          <p className="text-sky-200 text-xs mb-2">Distribusi Koleksi</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {categories.map((cat) => {
              const count = getBooksInCategory(cat.id).length;
              const pct = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
              return (
                <div
                  key={cat.id}
                  className={`bg-gradient-to-r ${gradients[cat.id]} flex items-center justify-center`}
                  style={{ width: `${pct}%` }}
                  title={`${cat.name}: ${pct}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {categories.map((cat) => {
              const count = getBooksInCategory(cat.id).length;
              const pct = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
              return (
                <div key={cat.id} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradients[cat.id]}`} />
                  <p className="text-sky-200 text-xs">{cat.name} {pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] ?? BookOpen;
          const booksInCat = getBooksInCategory(cat.id);
          const availableCount = booksInCat.filter((b) => b.available).length;
          const topRated = booksInCat.sort((a, b) => b.rating - a.rating).slice(0, 3);

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-100 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedCategory(cat)}
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-br ${gradients[cat.id]} p-5`}>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-white/80 text-sm bg-white/10 px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
                    {cat.count} buku
                  </span>
                </div>
                <h3 className="text-white text-lg mt-3" style={{ fontWeight: 700 }}>{cat.name}</h3>
                <p className="text-white/70 text-sm mt-0.5">{cat.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sky-700 text-xs" style={{ fontWeight: 600 }}>Tersedia: <span className="text-green-600">{availableCount} buku</span></p>
                  <p className="text-sky-400 text-xs">Dipinjam: {booksInCat.length - availableCount}</p>
                </div>

                {/* Top Books in Category */}
                {topRated.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sky-500 text-xs mb-1">Buku Populer:</p>
                    {topRated.map((book) => (
                      <div key={book.id} className="flex items-center gap-2">
                        <BookMarked size={12} className="text-sky-400 flex-shrink-0" />
                        <p className="text-sky-700 text-xs truncate flex-1">{book.title}</p>
                        <div className="flex items-center gap-0.5">
                          <StarIcon size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sky-600 text-xs">{book.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  to={`/books?category=${cat.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-sky-200 text-sky-700 text-sm hover:bg-sky-50 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Lihat Semua Buku <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCategory(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-br ${gradients[selectedCategory.id]} p-6 rounded-t-2xl`}>
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  {(() => {
                    const Icon = iconMap[selectedCategory.icon] ?? BookOpen;
                    return <Icon size={28} className="text-white" />;
                  })()}
                </div>
                <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                  ✕
                </button>
              </div>
              <h2 className="text-white text-2xl mt-4" style={{ fontWeight: 700 }}>{selectedCategory.name}</h2>
              <p className="text-white/70 text-sm mt-1">{selectedCategory.description}</p>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-white text-xl" style={{ fontWeight: 700 }}>{selectedCategory.count}</p>
                  <p className="text-white/60 text-xs">Total Buku</p>
                </div>
                <div>
                  <p className="text-white text-xl" style={{ fontWeight: 700 }}>
                    {getBooksInCategory(selectedCategory.id).filter((b) => b.available).length}
                  </p>
                  <p className="text-white/60 text-xs">Tersedia</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sky-700 text-sm mb-3" style={{ fontWeight: 600 }}>Koleksi dalam Kategori Ini</p>
              <div className="space-y-3">
                {getBooksInCategory(selectedCategory.id).map((book) => (
                  <div key={book.id} className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl">
                    <img src={book.cover} alt={book.title} className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sky-900 text-sm truncate" style={{ fontWeight: 600 }}>{book.title}</p>
                      <p className="text-sky-500 text-xs">{book.author} · {book.year}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarIcon size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sky-600 text-xs">{book.rating}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${book.available ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`} style={{ fontWeight: 500 }}>
                      {book.available ? "Tersedia" : "Dipinjam"}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to={`/books?category=${selectedCategory.id}`}
                onClick={() => setSelectedCategory(null)}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-sky-600 text-white py-3 rounded-xl hover:bg-sky-700 transition-colors"
                style={{ fontWeight: 600 }}
              >
                Lihat Semua di Menu Buku <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
