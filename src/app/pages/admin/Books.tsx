import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, UploadCloud, X, Search,
  BookOpen, Save, AlertTriangle, Loader2,
} from "lucide-react";
import { categories, shelves, Book } from "../../data/libraryData";
import { fetchBooksFromApi, createBook, updateBook, deleteBook } from "../../services/libraryApi";
import { loadBookData, saveBookData } from "../../utils/bookData";
import { loadLoans } from "../../utils/loanUtils";
import { useAuth } from "../../context/AuthContext";
import { addActivity } from "../../utils/activityHistory";

/* ─── helpers ────────────────────────────────────────────────── */
const getCategoryById = (id: string) => categories.find((c) => c.id === id);
const getShelfById = (id: string) => shelves.find((s) => s.id === id);

function getActiveBorrowCount(bookId: string): number {
  const loans = loadLoans();
  return loans.filter(
    (l) => l.bookId === bookId && (l.status === "Dipinjam" || l.status === "Menunggu")
  ).length;
}
const emptyBook: Omit<Book, "id"> = {
  title: "",
  author: "",
  categoryId: categories[0]?.id ?? "",
  shelfId: shelves[0]?.id ?? "",
  shelfPosition: "",
  cover: "",
  rating: 4.5,
  year: new Date().getFullYear(),
  pages: 0,
  isbn: "",
  available: true,
  stock: 1,
  description: "",
  publisher: "",
  recommended: false,
};

/* ═══════════════════════════════════════════════════════════════
   AdminBookCard – identical visual language to user BookCard,
   with edit/delete controls layered on the hover overlay
════════════════════════════════════════════════════════════════ */
function AdminBookCard({
  book,
  borrowCount,
  onEdit,
  onDelete,
}: {
  book: Book;
  borrowCount: number;
  onEdit: (b: Book) => void;
  onDelete: (b: Book) => void;
}) {
  const cat = getCategoryById(book.categoryId);
  const ratingFull = Math.round(book.rating);
  const availableStock = Math.max(0, book.stock - borrowCount);

  return (
    <div className="group">
      {/* Portrait image */}
      <div
        className="relative w-full overflow-hidden bg-slate-800"
        style={{ aspectRatio: "3 / 4" }}
      >
        <img
          src={book.cover || "https://placehold.co/300x400/e0f2fe/0284c7?text=No+Cover"}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* availability ribbon */}
        <div
          className={`absolute top-0 left-0 px-2.5 py-1 text-white text-xs ${
            book.available ? "bg-blue-500" : "bg-slate-500"
          }`}
          style={{ fontWeight: 600, letterSpacing: "0.03em" }}
        >
          {book.available ? "TERSEDIA" : "DIPINJAM"}
        </div>

        {/* admin hover overlay – edit / delete */}
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/40 transition-colors duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onEdit(book)}
            className="w-11 h-11 rounded-full bg-white text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors shadow-lg"
            title="Edit buku"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(book)}
            className="w-11 h-11 rounded-full bg-white text-rose-600 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-lg"
            title="Hapus buku"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Text */}
      <div className="mt-3 space-y-1">
        <p
          className="text-white text-sm leading-snug line-clamp-2"
          style={{ fontWeight: 500 }}
        >
          {book.title}
        </p>
        <p className="text-slate-500 text-xs tracking-wide uppercase">
          {book.author}
        </p>

        {/* rating dots */}
        <div className="flex items-center gap-1 pt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: i < ratingFull ? "#3b82f6" : "#1e3a5f",
                outline: i < ratingFull ? "1.5px solid #3b82f6" : "1.5px solid #1e3a5f",
              }}
            />
          ))}
          <span className="text-slate-500 text-xs ml-1">{book.rating}</span>
        </div>

        {/* shelf info */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-blue-400 text-sm" style={{ fontWeight: 700 }}>
            {getShelfById(book.shelfId)?.name ?? "-"}
          </span>
          {cat && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${cat.color}`}>
              {cat.name.split(" ")[0]}
            </span>
          )}
        </div>

        {/* stock row (admin-only info) */}
        <p className="text-slate-500 text-xs pt-0.5">
          Stok: <span className="text-blue-400" style={{ fontWeight: 600 }}>{book.stock}</span>
          {borrowCount > 0 && (
            <span className="text-slate-600 ml-1">
              (<span className="text-emerald-400" style={{ fontWeight: 600 }}>{availableStock}</span> tersedia)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BookFormModal – shared form for Add / Edit
════════════════════════════════════════════════════════════════ */
function BookFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Book | (Omit<Book, "id"> & { id?: string });
  onClose: () => void;
  onSave: (book: Book) => void;
}) {
  const [form, setForm] = useState<Omit<Book, "id"> & { id?: string }>(initial);
  const isEdit = Boolean(initial.id);

  const set = <K extends keyof Book>(key: K, value: Book[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = form.id ?? `book-${Date.now()}`;
    onSave({ ...form, id } as Book);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-blue-500 text-xs tracking-widest uppercase mb-0.5" style={{ fontWeight: 600 }}>
              {isEdit ? "Edit Data" : "Tambah Baru"}
            </p>
            <h2 className="text-white text-lg" style={{ fontWeight: 700 }}>
              {isEdit ? "Edit Buku" : "Tambah Buku"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-blue-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Judul Buku
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
                placeholder="Contoh: Laskar Pelangi"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Penulis
              </label>
              <input
                required
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Penerbit
              </label>
              <input
                value={form.publisher}
                onChange={(e) => set("publisher", e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Kategori
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Rak
              </label>
              <select
                value={form.shelfId}
                onChange={(e) => set("shelfId", e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              >
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Posisi Rak
              </label>
              <input
                value={form.shelfPosition}
                onChange={(e) => set("shelfPosition", e.target.value)}
                placeholder="Contoh: A-01-03"
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Tahun Terbit
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set("year", Number(e.target.value))}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Jumlah Halaman
              </label>
              <input
                type="number"
                value={form.pages}
                onChange={(e) => set("pages", Number(e.target.value))}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                ISBN
              </label>
              <input
                value={form.isbn}
                onChange={(e) => set("isbn", e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Stok
              </label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Rating (0 – 5)
              </label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => set("rating", Number(e.target.value))}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                URL Cover
              </label>
              <input
                value={form.cover}
                onChange={(e) => set("cover", e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Deskripsi / Sinopsis
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-blue-500/30 focus:border-blue-500 rounded-lg bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => set("available", e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-slate-300">Tersedia untuk dipinjam</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.recommended}
                onChange={(e) => set("recommended", e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-slate-300">Tandai sebagai rekomendasi</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-500 text-white py-3 text-sm hover:bg-blue-400 transition-colors mt-4"
              style={{ fontWeight: 700, letterSpacing: "0.05em" }}
            >
              <Save size={16} /> {isEdit ? "SIMPAN PERUBAHAN" : "TAMBAH BUKU"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors mt-4"
              style={{ fontWeight: 600 }}
            >
              BATAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Delete confirmation modal
════════════════════════════════════════════════════════════════ */
function DeleteConfirmModal({
  book,
  onCancel,
  onConfirm,
}: {
  book: Book;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 w-full max-w-sm shadow-2xl p-6 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-rose-400" />
        </div>
        <h3 className="text-white text-lg mb-1" style={{ fontWeight: 700 }}>
          Hapus buku ini?
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          <span style={{ fontWeight: 600 }}>{book.title}</span> akan dihapus permanen dari katalog. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-rose-600 text-white py-2.5 text-sm hover:bg-rose-700 transition-colors"
            style={{ fontWeight: 700 }}
          >
            HAPUS
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
            style={{ fontWeight: 600 }}
          >
            BATAL
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main AdminBooks Page
════════════════════════════════════════════════════════════════ */
export function AdminBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>(loadBookData);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingBook, setEditingBook] = useState<Book | (Omit<Book, "id">) | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [borrowCounts, setBorrowCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBooksFromApi().then((data) => {
      if (data) {
        setBooks(data);
        saveBookData(data);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const counts: Record<string, number> = {};
    const loans = loadLoans();
    loans.forEach((l) => {
      if (l.status === "Dipinjam" || l.status === "Menunggu") {
        counts[l.bookId] = (counts[l.bookId] || 0) + 1;
      }
    });
    setBorrowCounts(counts);
  }, [books]);

  useEffect(() => {
    if (!loading) saveBookData(books);
  }, [books, loading]);

  const filtered = books.filter((book) => {
    const matchSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || book.categoryId === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleSave = async (book: Book) => {
    const exists = books.some((b) => b.id === book.id);
    if (exists) {
      setBooks((prev) => prev.map((b) => (b.id === book.id ? book : b)));
      await updateBook(book);
    } else {
      const tempId = `temp-${Date.now()}`;
      setBooks((prev) => [{ ...book, id: tempId }, ...prev]);
      const created = await createBook(book);
      if (created) {
        setBooks((prev) => prev.map((b) => (b.id === tempId ? created : b)));
      }
    }
    if (user) {
      addActivity(
        user.namaLengkap,
        user.email,
        "Buku",
        exists ? "Edit" : "Tambah",
        exists
          ? `Mengedit buku "${book.title}" oleh ${book.author}`
          : `Menambahkan buku baru "${book.title}" oleh ${book.author}`,
      );
    }
    setEditingBook(null);
  };

  const handleDelete = async () => {
    if (!deletingBook) return;
    setBooks((prev) => prev.filter((b) => b.id !== deletingBook.id));
    await deleteBook(deletingBook.id);
    if (user) {
      addActivity(
        user.namaLengkap,
        user.email,
        "Buku",
        "Hapus",
        `Menghapus buku "${deletingBook.title}" dari katalog`,
      );
    }
    setDeletingBook(null);
  };

  return (
    <div>
      {/* ── Page title & actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-blue-500 text-xs tracking-widest uppercase mb-1" style={{ fontWeight: 600 }}>
            Manajemen Buku
          </p>
          <h1 className="text-white text-3xl" style={{ fontWeight: 700 }}>
            Kelola Katalog
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setEditingBook(emptyBook)}
            className="inline-flex items-center justify-center gap-2 bg-blue-500 px-5 py-3 text-white text-sm hover:bg-blue-400 transition-colors"
            style={{ fontWeight: 700, letterSpacing: "0.05em" }}
          >
            <Plus size={16} /> TAMBAH BUKU
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 border border-white/10 bg-slate-900 px-5 py-3 text-slate-300 text-sm hover:bg-white/5 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <UploadCloud size={16} /> IMPORT CSV
          </button>
        </div>
      </div>

      {/* ── Search + category filter ── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, penulis…"
            className="w-full pl-9 pr-4 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors sm:w-56"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* ── Result count ── */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
        <p className="text-blue-400 text-sm">
          <span style={{ fontWeight: 700 }}>{filtered.length}</span> dari {books.length} buku
        </p>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400" style={{ fontWeight: 600 }}>Buku tidak ditemukan</p>
          <p className="text-slate-500 text-sm mt-1">Coba ubah kata kunci atau kategori</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
          {filtered.map((book) => (
            <AdminBookCard
              key={book.id}
              book={book}
              borrowCount={borrowCounts[book.id] || 0}
              onEdit={setEditingBook}
              onDelete={setDeletingBook}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {editingBook && (
        <BookFormModal
          initial={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {deletingBook && (
        <DeleteConfirmModal
          book={deletingBook}
          onCancel={() => setDeletingBook(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
