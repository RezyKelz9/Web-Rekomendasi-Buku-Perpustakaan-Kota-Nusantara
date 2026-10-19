import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useOutletContext } from "react-router";
import {
  Search, BookOpen, Microscope, Landmark, Baby, TrendingUp,
  Star as StarIcon, ChevronRight, ChevronLeft, X, Eye,
  Calendar, Hash, MapPin, Package,
} from "lucide-react";
import { categories, shelves, Book } from "../../data/libraryData";
import { getAvailableBooks } from "../../utils/bookAvailability";

/* ─── Icon map per category ─────────────────────────────────── */
const categoryIconMap: Record<string, React.ElementType> = {
  novel: BookOpen,
  science: Microscope,
  history: Landmark,
  children: Baby,
  selfhelp: TrendingUp,
  religion: StarIcon,
};

/* ─── helpers ────────────────────────────────────────────────── */
const getCategoryById  = (id: string) => categories.find((c) => c.id === id);
const getShelfById     = (id: string) => shelves.find((s) => s.id === id);

/* ═══════════════════════════════════════════════════════════════
   BookCard  –  Portrait, no border, Uniqlo-style
═══════════════════════════════════════════════════════════════ */
function BookCard({
  book,
  onSelect,
  width = 176,
}: {
  book: Book;
  onSelect: (b: Book) => void;
  width?: number | null;
}) {
  const cat = getCategoryById(book.categoryId);
  const ratingFull = Math.round(book.rating);

  return (
    <div
      className={`cursor-pointer group ${width ? "flex-shrink-0" : "w-full"}`}
      style={width ? { width } : undefined}
      onClick={() => onSelect(book)}
    >
      {/* ── Portrait image ── */}
      <div
        className="relative w-full overflow-hidden bg-sky-50"
        style={{ aspectRatio: "3 / 4" }}
      >
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* availability ribbon */}
        <div
          className={`absolute top-0 left-0 px-2.5 py-1 text-white text-xs ${
            book.available ? "bg-sky-600" : "bg-slate-500"
          }`}
          style={{ fontWeight: 600, letterSpacing: "0.03em" }}
        >
          {book.available ? "TERSEDIA" : "DIPINJAM"}
        </div>

        {/* hover overlay */}
        <div className="absolute inset-0 bg-sky-900/0 group-hover:bg-sky-900/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <span
            className="bg-white text-sky-800 text-xs px-5 py-2 tracking-wide"
            style={{ fontWeight: 700, letterSpacing: "0.08em" }}
          >
            LIHAT DETAIL
          </span>
        </div>
      </div>

      {/* ── Text ── */}
      <div className="mt-3 space-y-1">
        <p
          className="text-sky-900 text-sm leading-snug line-clamp-2"
          style={{ fontWeight: 500 }}
        >
          {book.title}
        </p>
        <p className="text-slate-400 text-xs tracking-wide uppercase">
          {book.author}
        </p>

        {/* rating dots – like color swatches */}
        <div className="flex items-center gap-1 pt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: i < ratingFull ? "#0284c7" : "#e0f2fe",
                outline: i < ratingFull ? "1.5px solid #0284c7" : "1.5px solid #bae6fd",
              }}
            />
          ))}
          <span className="text-slate-400 text-xs ml-1">{book.rating}</span>
        </div>

        {/* shelf info – like price row */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-slate-300 text-xs line-through">{book.year}</span>
          <span className="text-sky-700 text-sm" style={{ fontWeight: 700 }}>
            {getShelfById(book.shelfId)?.name}
          </span>
          {cat && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${cat.color}`}>
              {cat.name.split(" ")[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HorizontalSection  –  Uniqlo "collection row"
═══════════════════════════════════════════════════════════════ */
function HorizontalSection({
  sectionLabel,
  title,
  items,
  linkTo,
  onSelect,
}: {
  sectionLabel: string;
  title: string;
  items: Book[];
  linkTo: string;
  onSelect: (b: Book) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += dir * 560;
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-14">
      {/* Section header */}
      <div className="flex items-end justify-between mb-5 border-b border-sky-100 pb-3">
        <div>
          <p
            className="text-sky-500 text-xs tracking-widest uppercase mb-0.5"
            style={{ fontWeight: 600 }}
          >
            {sectionLabel}
          </p>
          <h2 className="text-sky-900 text-xl" style={{ fontWeight: 700 }}>
            {title}
          </h2>
        </div>
        <Link
          to={linkTo}
          className="text-sky-600 text-xs tracking-widest uppercase flex items-center gap-1 hover:text-sky-800 transition-colors"
          style={{ fontWeight: 700 }}
        >
          VIEW ALL <ChevronRight size={14} />
        </Link>
      </div>

      {/* Scrollable row */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          className="hidden lg:flex absolute -left-5 top-1/3 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-sky-100 shadow-md rounded-full items-center justify-center text-sky-600 hover:bg-sky-50 transition-all opacity-0 group-hover/row:opacity-100"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-2"
          style={{ scrollBehavior: "smooth", scrollbarWidth: "none" }}
        >
          {items.map((book: Book) => (
            <BookCard key={book.id} book={book} onSelect={onSelect} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          className="hidden lg:flex absolute -right-5 top-1/3 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-sky-100 shadow-md rounded-full items-center justify-center text-sky-600 hover:bg-sky-50 transition-all opacity-0 group-hover/row:opacity-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Books Page
═══════════════════════════════════════════════════════════════ */
export function Books() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery]         = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedBook, setSelectedBook]       = useState<ReturnType<typeof getAvailableBooks>[0] | null>(null);
  const [books, setBooks] = useState(getAvailableBooks());

  const { addToBookshelf } = useOutletContext<any>();

  useEffect(() => {
    // Update books on mount and when availability changes
    setBooks(getAvailableBooks());

    // Listen for storage changes
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

  useEffect(() => {
    const bookId = searchParams.get("id");
    if (bookId) {
      const found = books.find((b) => b.id === bookId);
      if (found) setSelectedBook(found);
    }
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  /* Filtered list for grid/search mode */
  const isFiltered = searchQuery || selectedCategory !== "all" || availabilityFilter !== "all";

  const filtered = books.filter((book) => {
    const matchSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || book.categoryId === selectedCategory;
    const matchAvail =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && book.available) ||
      (availabilityFilter === "borrowed" && !book.available);
    return matchSearch && matchCategory && matchAvail;
  });

  return (
    <div className="bg-white min-h-screen -m-4 lg:-m-8 px-6 lg:px-10 pt-8 pb-16">

      {/* ── Page title & search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p
            className="text-sky-500 text-xs tracking-widest uppercase mb-1"
            style={{ fontWeight: 600 }}
          >
            Perpustakaan Kota Nusantara
          </p>
          <h1 className="text-sky-900 text-3xl" style={{ fontWeight: 700 }}>
            Koleksi Buku
          </h1>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, penulis…"
            className="w-full pl-9 pr-4 py-2.5 border-b-2 border-sky-200 focus:border-sky-600 bg-transparent text-sm text-sky-900 placeholder-slate-300 outline-none transition-colors"
            style={{ fontWeight: 400 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-sky-500"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category icons – "Shop by category" row ── */}
      <div className="mb-10">
        <p className="text-sky-900 text-base mb-4" style={{ fontWeight: 700 }}>
          Jelajahi Kategori
        </p>
        <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {/* All */}
          <button
            onClick={() => { setSelectedCategory("all"); setAvailabilityFilter("all"); }}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors border-2 ${
                selectedCategory === "all"
                  ? "bg-sky-600 border-sky-600"
                  : "bg-white border-sky-200 group-hover:border-sky-400"
              }`}
            >
              <BookOpen
                size={22}
                className={selectedCategory === "all" ? "text-white" : "text-sky-500"}
              />
            </div>
            <span
              className={`text-xs text-center ${
                selectedCategory === "all" ? "text-sky-700" : "text-slate-500"
              }`}
              style={{ fontWeight: selectedCategory === "all" ? 700 : 400 }}
            >
              Semua
            </span>
          </button>

          {categories.map((cat) => {
            const Icon = categoryIconMap[cat.id] ?? BookOpen;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(active ? "all" : cat.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors border-2 ${
                    active
                      ? "bg-sky-600 border-sky-600"
                      : "bg-white border-sky-200 group-hover:border-sky-400"
                  }`}
                >
                  <Icon size={22} className={active ? "text-white" : "text-sky-500"} />
                </div>
                <span
                  className={`text-xs text-center leading-tight max-w-[72px] ${
                    active ? "text-sky-700" : "text-slate-500"
                  }`}
                  style={{ fontWeight: active ? 700 : 400 }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}

          {/* Availability filters */}
          <div className="w-px bg-sky-100 mx-2 self-stretch" />

          {[
            { value: "available", label: "Tersedia" },
            { value: "borrowed", label: "Dipinjam" },
          ].map((opt) => {
            const active = availabilityFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAvailabilityFilter(active ? "all" : opt.value)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${
                    active
                      ? opt.value === "available"
                        ? "bg-green-500 border-green-500"
                        : "bg-rose-500 border-rose-500"
                      : "bg-white border-sky-200 group-hover:border-sky-400"
                  }`}
                >
                  <span className={`text-lg ${active ? "text-white" : "text-sky-400"}`}>
                    {opt.value === "available" ? "✓" : "○"}
                  </span>
                </div>
                <span
                  className="text-xs text-center text-slate-500"
                  style={{ fontWeight: active ? 700 : 400 }}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-sky-100 mb-10" />

      {/* ══════════════════════════════════════════════════════
          MODE A: Searching / filtered  →  grid
      ══════════════════════════════════════════════════════ */}
      {isFiltered ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sky-700 text-sm">
              <span style={{ fontWeight: 700 }}>{filtered.length}</span> buku ditemukan
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setAvailabilityFilter("all"); }}
              className="text-xs text-slate-400 hover:text-sky-600 flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Reset semua filter
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <BookOpen size={48} className="text-sky-100 mx-auto mb-4" />
              <p className="text-sky-500" style={{ fontWeight: 600 }}>Buku tidak ditemukan</p>
              <p className="text-slate-400 text-sm mt-1">Coba ubah kata kunci atau filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} onSelect={setSelectedBook} width={null} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════
            MODE B: Default  →  Uniqlo-style horizontal rows
        ══════════════════════════════════════════════════════ */
        <div>
          {/* Recommended row */}
          <HorizontalSection
            sectionLabel="Pilihan Editor"
            title="Buku Rekomendasi"
            items={books.filter((b) => b.recommended)}
            linkTo="/user/books?category=all"
            onSelect={setSelectedBook}
          />

          {/* Per-category rows */}
          {categories.map((cat) => (
            <HorizontalSection
              key={cat.id}
              sectionLabel="Koleksi"
              title={cat.name}
              items={books.filter((b) => b.categoryId === cat.id)}
              linkTo={`/user/books?category=${cat.id}`}
              onSelect={setSelectedBook}
            />
          ))}

          {/* Available now row */}
          <HorizontalSection
            sectionLabel="Siap Dipinjam"
            title="Tersedia Sekarang"
            items={books.filter((b) => b.available).slice(0, 10)}
            linkTo="/user/books?availability=available"
            onSelect={setSelectedBook}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          Book Detail Modal
      ══════════════════════════════════════════════════════ */}
      {selectedBook && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal hero */}
            <div className="flex flex-col sm:flex-row">
              {/* Cover */}
              <div
                className="sm:w-56 flex-shrink-0 bg-sky-50 relative"
                style={{ aspectRatio: "3/4" }}
              >
                <img
                  src={selectedBook.cover}
                  alt={selectedBook.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className={`absolute top-0 left-0 px-3 py-1 text-white text-xs ${
                    selectedBook.available ? "bg-sky-600" : "bg-slate-500"
                  }`}
                  style={{ fontWeight: 700, letterSpacing: "0.05em" }}
                >
                  {selectedBook.available ? "TERSEDIA" : "DIPINJAM"}
                </div>
              </div>

              {/* Info panel */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getCategoryById(selectedBook.categoryId)?.color}`}
                      style={{ fontWeight: 600 }}
                    >
                      {getCategoryById(selectedBook.categoryId)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-slate-300 hover:text-sky-600 transition-colors flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h2
                  className="text-sky-900 text-xl mt-3 leading-snug"
                  style={{ fontWeight: 700 }}
                >
                  {selectedBook.title}
                </h2>
                <p
                  className="text-slate-400 text-sm mt-1 uppercase tracking-wide"
                  style={{ fontWeight: 500 }}
                >
                  {selectedBook.author}
                </p>

                {/* Rating dots */}
                <div className="flex items-center gap-1.5 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full"
                      style={{
                        width: 10,
                        height: 10,
                        backgroundColor:
                          i < Math.round(selectedBook.rating) ? "#0284c7" : "#e0f2fe",
                        outline:
                          i < Math.round(selectedBook.rating)
                            ? "1.5px solid #0284c7"
                            : "1.5px solid #bae6fd",
                      }}
                    />
                  ))}
                  <span className="text-slate-400 text-xs ml-1">
                    {selectedBook.rating} / 5.0
                  </span>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed mt-4 flex-1">
                  {selectedBook.description}
                </p>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { icon: BookOpen, label: "Halaman", value: `${selectedBook.pages} hal` },
                    { icon: Calendar, label: "Tahun", value: selectedBook.year.toString() },
                    { icon: Hash, label: "ISBN", value: selectedBook.isbn },
                    { icon: Eye, label: "Penerbit", value: selectedBook.publisher },
                    {
                      icon: MapPin,
                      label: "Lokasi Rak",
                      value: `${getShelfById(selectedBook.shelfId)?.name} · ${selectedBook.shelfPosition}`,
                    },
                    {
                      icon: Package,
                      label: "Stok Tersedia",
                      value: `${selectedBook.stock}`,
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-1.5">
                      <Icon size={12} className="text-sky-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs">{label}</p>
                        <p
                          className="text-sky-900 text-xs"
                          style={{ fontWeight: 600 }}
                        >
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="border-t border-sky-50 px-6 py-4 flex gap-3">
              {selectedBook.available ? (
                <button
                  onClick={() => addToBookshelf(selectedBook)}
                  className="flex-1 bg-sky-600 text-white py-3 text-sm tracking-widest hover:bg-sky-700 transition-colors"
                  style={{ fontWeight: 700, letterSpacing: "0.1em" }}
                >
                  PINJAM BUKU INI
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 bg-slate-100 text-slate-400 py-3 text-sm tracking-widest cursor-not-allowed"
                  style={{ fontWeight: 700, letterSpacing: "0.1em" }}
                >
                  SEDANG DIPINJAM
                </button>
              )}
              <button
                onClick={() => setSelectedBook(null)}
                className="px-5 py-3 border border-sky-200 text-sky-600 text-sm hover:bg-sky-50 transition-colors"
                style={{ fontWeight: 600 }}
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}