import { useState, useEffect } from "react";
import { MapPin, BookOpen, Layers, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { fetchShelves, fetchCategories, fetchBooks } from "../../services/libraryApi";
import type { Shelf, Category, Book } from "../../data/libraryData";

const floorColors: Record<number, string> = {
  1: "bg-sky-50 border-sky-200",
  2: "bg-indigo-50 border-indigo-200",
  3: "bg-cyan-50 border-cyan-200",
};

const floorLabels: Record<number, string> = {
  1: "Lantai 1",
  2: "Lantai 2",
  3: "Lantai 3",
};

const floorBadgeColors: Record<number, string> = {
  1: "bg-sky-100 text-sky-700",
  2: "bg-indigo-100 text-indigo-700",
  3: "bg-cyan-100 text-cyan-700",
};

export function Shelves() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [shelvesData, categoriesData, booksData] = await Promise.all([
        fetchShelves(),
        fetchCategories(),
        fetchBooks(),
      ]);
      const occupiedMap = new Map<string, number>();
      for (const b of booksData) {
        occupiedMap.set(b.shelfId, (occupiedMap.get(b.shelfId) || 0) + 1);
      }
      const shelvesWithOccupied = shelvesData.map((s) => ({
        ...s,
        occupied: occupiedMap.get(s.id) || 0,
      }));
      setShelves(shelvesWithOccupied);
      setCategories(categoriesData);
      setBooks(booksData);
      setLoading(false);
    }
    loadData();
  }, []);

  const floors = [1, 2, 3];

  const getBooksOnShelf = (shelfId: string) =>
    books.filter((b) => b.shelfId === shelfId);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  const getCategoryColor = (id: string) =>
    categories.find((c) => c.id === id)?.color ?? "bg-gray-100 text-gray-600";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sky-500 text-sm">Memuat data rak buku...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-sky-900 text-2xl" style={{ fontWeight: 700 }}>Tempat Rak Buku</h1>
        <p className="text-sky-500 text-sm mt-1">Denah dan lokasi rak buku di setiap lantai perpustakaan</p>
      </div>

      {/* Floor Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedFloor("all")}
          className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedFloor === "all" ? "bg-sky-600 text-white" : "bg-white border border-sky-200 text-sky-700 hover:bg-sky-50"}`}
          style={{ fontWeight: 500 }}
        >
          Semua Lantai
        </button>
        {floors.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFloor(f)}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${selectedFloor === f ? "bg-sky-600 text-white" : "bg-white border border-sky-200 text-sky-700 hover:bg-sky-50"}`}
            style={{ fontWeight: 500 }}
          >
            Lantai {f}
          </button>
        ))}
      </div>

      {/* Floor Maps */}
      {(selectedFloor === "all" ? floors : [selectedFloor]).map((floor) => {
        const floorShelves = shelves.filter((s) => s.floor === floor);
        return (
          <div key={floor} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className={`px-3 py-1 rounded-full text-sm ${floorBadgeColors[floor]}`} style={{ fontWeight: 600 }}>
                {floorLabels[floor]}
              </div>
              <p className="text-sky-500 text-sm">{floorShelves.length} rak buku</p>
            </div>

            {/* Floor Layout Visual */}
            <div className={`rounded-2xl p-5 border mb-4 ${floorColors[floor]}`}>
              <div className="flex items-start gap-2 mb-3">
                <Layers size={16} className="text-sky-600 mt-0.5" />
                <p className="text-sky-800 text-sm" style={{ fontWeight: 600 }}>Denah Lantai {floor}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {floorShelves.map((shelf) => {
                  const occupancy = Math.round((shelf.occupied / shelf.capacity) * 100);
                  return (
                    <button
                      key={shelf.id}
                      onClick={() => setSelectedShelf(shelf)}
                      className="bg-white rounded-xl p-4 border border-white/80 shadow-sm hover:shadow-md transition-all text-left hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                          <span className="text-sky-700 text-sm" style={{ fontWeight: 700 }}>{shelf.id}</span>
                        </div>
                        <ArrowUpRight size={14} className="text-sky-400 group-hover:text-sky-600 transition-colors" />
                      </div>
                      <p className="text-sky-900 text-sm" style={{ fontWeight: 700 }}>{shelf.name}</p>
                      <p className="text-sky-500 text-xs mt-0.5">{shelf.location}</p>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-sky-500">Kapasitas</span>
                          <span className="text-sky-700" style={{ fontWeight: 600 }}>{occupancy}%</span>
                        </div>
                        <div className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${occupancy > 80 ? "bg-rose-400" : occupancy > 60 ? "bg-sky-400" : "bg-green-400"}`}
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                        <p className="text-sky-400 text-xs mt-1">{shelf.occupied}/{shelf.capacity} buku</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {shelf.categories.map((catId) => (
                          <span key={catId} className={`text-xs px-1.5 py-0.5 rounded-full ${getCategoryColor(catId)}`}>
                            {getCategoryName(catId)}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Shelf Detail Modal */}
      {selectedShelf && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedShelf(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center mb-3">
                    <span className="text-sky-700 text-xl" style={{ fontWeight: 700 }}>{selectedShelf.id}</span>
                  </div>
                  <h2 className="text-sky-900 text-xl" style={{ fontWeight: 700 }}>{selectedShelf.name}</h2>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-sky-500" />
                    <p className="text-sky-500 text-sm">{selectedShelf.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedShelf(null)}
                  className="p-2 rounded-xl text-sky-400 hover:bg-sky-50 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-sky-50 rounded-xl p-3 text-center">
                  <p className="text-sky-900 text-lg" style={{ fontWeight: 700 }}>{selectedShelf.capacity}</p>
                  <p className="text-sky-500 text-xs">Kapasitas</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-3 text-center">
                  <p className="text-sky-900 text-lg" style={{ fontWeight: 700 }}>{selectedShelf.occupied}</p>
                  <p className="text-sky-500 text-xs">Terisi</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-3 text-center">
                  <p className="text-sky-900 text-lg" style={{ fontWeight: 700 }}>{selectedShelf.capacity - selectedShelf.occupied}</p>
                  <p className="text-sky-500 text-xs">Kosong</p>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-sky-700 text-sm mb-2" style={{ fontWeight: 600 }}>Kategori di Rak Ini</p>
                <div className="flex flex-wrap gap-2">
                  {selectedShelf.categories.map((catId) => (
                    <span key={catId} className={`px-3 py-1.5 rounded-full text-sm ${getCategoryColor(catId)}`} style={{ fontWeight: 500 }}>
                      {getCategoryName(catId)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sky-700 text-sm mb-3" style={{ fontWeight: 600 }}>
                  Buku di {selectedShelf.name} ({getBooksOnShelf(selectedShelf.id).length} buku)
                </p>
                <div className="space-y-2">
                  {getBooksOnShelf(selectedShelf.id).map((book) => (
                    <div key={book.id} className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl">
                      <img src={book.cover} alt={book.title} className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sky-900 text-sm truncate" style={{ fontWeight: 600 }}>{book.title}</p>
                        <p className="text-sky-500 text-xs truncate">{book.author}</p>
                        <p className="text-sky-400 text-xs mt-0.5">Posisi: {book.shelfPosition}</p>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${book.available ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`} style={{ fontWeight: 500 }}>
                        {book.available ? "Ada" : "Dipinjam"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={`/books?category=${selectedShelf.categories[0]}`}
                onClick={() => setSelectedShelf(null)}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-sky-600 text-white py-3 rounded-xl hover:bg-sky-700 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <BookOpen size={16} />
                Lihat Semua Buku Kategori Ini
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm mt-6">
        <p className="text-sky-900 text-sm mb-3" style={{ fontWeight: 700 }}>Keterangan Kapasitas Rak</p>
        <div className="flex flex-wrap gap-4">
          {[
            { color: "bg-green-400", label: "Di bawah 60% – Masih longgar" },
            { color: "bg-sky-400", label: "60%–80% – Cukup penuh" },
            { color: "bg-rose-400", label: "Di atas 80% – Hampir penuh" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-1.5 rounded-full ${item.color}`} />
              <p className="text-sky-600 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
