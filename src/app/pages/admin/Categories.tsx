import { useState } from "react";
import {
  BookOpen, Microscope, Landmark, Baby, TrendingUp,
  Star as StarIcon, Plus, Pencil, Trash2, X, Save,
  AlertTriangle, BookMarked,
} from "lucide-react";
import { categories as initialCategories, books, Category } from "../../data/libraryData";
import { useAuth } from "../../context/AuthContext";
import { addActivity } from "../../utils/activityHistory";

/* ── helpers ── */
const iconMap: Record<string, React.ElementType> = {
  BookOpen, Microscope, Landmark, Baby, TrendingUp, Star: StarIcon,
};

const gradients: Record<string, string> = {
  novel:    "from-rose-400 to-pink-600",
  science:  "from-blue-400 to-blue-700",
  history:  "from-amber-400 to-orange-500",
  children: "from-green-400 to-emerald-600",
  selfhelp: "from-purple-400 to-violet-600",
  religion: "from-orange-400 to-red-500",
};

const defaultGradient = "from-slate-400 to-slate-600";

const iconOptions = Object.keys(iconMap);

const emptyCategory: Omit<Category, "id"> = {
  name: "",
  icon: "BookOpen",
  color: "bg-blue-500/20 text-blue-400",
  description: "",
  count: 0,
};

/* ── CategoryFormModal ── */
function CategoryFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Category | (Omit<Category, "id"> & { id?: string });
  onClose: () => void;
  onSave: (cat: Category) => void;
}) {
  const [form, setForm] = useState<Omit<Category, "id"> & { id?: string }>(initial);
  const isEdit = Boolean((initial as any).id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (form as any).id ?? form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    onSave({ ...form, id } as Category);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-blue-500 text-xs tracking-widest uppercase mb-0.5" style={{ fontWeight: 600 }}>
              {isEdit ? "Edit Data" : "Tambah Baru"}
            </p>
            <h2 className="text-white text-lg" style={{ fontWeight: 700 }}>
              {isEdit ? "Edit Kategori" : "Tambah Kategori"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-blue-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
              Nama Kategori
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Novel & Fiksi"
              className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
              Deskripsi
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Deskripsi singkat kategori"
              className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Ikon
              </label>
              <select
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              >
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Jumlah Buku
              </label>
              <input
                type="number"
                min={0}
                value={form.count}
                onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) }))}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-500 text-white py-3 text-sm hover:bg-blue-400 transition-colors mt-4 rounded-xl"
              style={{ fontWeight: 700, letterSpacing: "0.05em" }}
            >
              <Save size={16} /> {isEdit ? "SIMPAN PERUBAHAN" : "TAMBAH KATEGORI"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors mt-4 rounded-xl"
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

/* ── DeleteConfirmModal ── */
function DeleteConfirmModal({
  category,
  onCancel,
  onConfirm,
}: {
  category: Category;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-slate-900 w-full max-w-sm shadow-2xl p-6 rounded-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-rose-400" />
        </div>
        <h3 className="text-white text-lg mb-1" style={{ fontWeight: 700 }}>Hapus kategori ini?</h3>
        <p className="text-slate-400 text-sm mb-6">
          <span style={{ fontWeight: 600 }}>{category.name}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-rose-600 text-white py-2.5 text-sm hover:bg-rose-700 transition-colors rounded-xl"
            style={{ fontWeight: 700 }}
          >
            HAPUS
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors rounded-xl"
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
   Main AdminCategories Page
════════════════════════════════════════════════════════════════ */
export function AdminCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | Omit<Category, "id"> | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const getBooksInCategory = (id: string) => books.filter((b) => b.categoryId === id);
  const totalBooks = books.length;

  const handleSave = (cat: Category) => {
    const exists = categories.some((c) => c.id === cat.id);
    setCategories((prev) => {
      return exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
    });
    if (user) {
      addActivity(
        user.namaLengkap,
        user.email,
        "Kategori",
        exists ? "Edit" : "Tambah",
        exists
          ? `Mengedit kategori "${cat.name}"`
          : `Menambahkan kategori baru "${cat.name}"`,
      );
    }
    setEditingCategory(null);
    setSelectedCategory(null);
  };

  const handleDelete = () => {
    if (!deletingCategory) return;
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
    if (user) {
      addActivity(
        user.namaLengkap,
        user.email,
        "Kategori",
        "Hapus",
        `Menghapus kategori "${deletingCategory.name}"`,
      );
    }
    setDeletingCategory(null);
    setSelectedCategory(null);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-blue-500 text-xs tracking-widest uppercase mb-1" style={{ fontWeight: 600 }}>
            Manajemen Kategori
          </p>
          <h1 className="text-white text-3xl" style={{ fontWeight: 700 }}>Kelola Kategori Buku</h1>
        </div>
        <button
          onClick={() => setEditingCategory(emptyCategory)}
          className="inline-flex items-center justify-center gap-2 bg-blue-500 px-5 py-3 text-white text-sm hover:bg-blue-400 transition-colors rounded-xl"
          style={{ fontWeight: 700, letterSpacing: "0.05em" }}
        >
          <Plus size={16} /> TAMBAH KATEGORI
        </button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-900 rounded-2xl p-5 mb-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-blue-200 text-sm">Total Koleksi Perpustakaan</p>
            <p className="text-white text-3xl mt-1" style={{ fontWeight: 700 }}>{totalBooks} Buku</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-white text-xl" style={{ fontWeight: 700 }}>{categories.length}</p>
              <p className="text-blue-300 text-xs">Kategori</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white text-xl" style={{ fontWeight: 700 }}>{books.filter((b) => b.available).length}</p>
              <p className="text-blue-300 text-xs">Tersedia</p>
            </div>
          </div>
        </div>

        {/* Distribution Bar */}
        <div className="mt-4">
          <p className="text-blue-200 text-xs mb-2">Distribusi Koleksi</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {categories.map((cat) => {
              const count = getBooksInCategory(cat.id).length;
              const pct = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
              return (
                <div
                  key={cat.id}
                  className={`bg-gradient-to-r ${gradients[cat.id] ?? defaultGradient}`}
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
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradients[cat.id] ?? defaultGradient}`} />
                  <p className="text-blue-200 text-xs">{cat.name} {pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Category Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] ?? BookOpen;
          const booksInCat = getBooksInCategory(cat.id);
          const availableCount = booksInCat.filter((b) => b.available).length;
          const topRated = [...booksInCat].sort((a, b) => b.rating - a.rating).slice(0, 3);
          const grad = gradients[cat.id] ?? defaultGradient;

          return (
            <div
              key={cat.id}
              className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-white/10 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedCategory(cat)}
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-br ${grad} p-5 relative`}>
                {/* Admin controls */}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                    className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                    title="Edit kategori"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingCategory(cat); }}
                    className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-rose-500/40 transition-colors"
                    title="Hapus kategori"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-white/80 text-sm bg-white/10 px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
                    {booksInCat.length} buku
                  </span>
                </div>
                <h3 className="text-white text-lg mt-3" style={{ fontWeight: 700 }}>{cat.name}</h3>
                <p className="text-white/70 text-sm mt-0.5">{cat.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-blue-400 text-xs" style={{ fontWeight: 600 }}>
                    Tersedia: <span className="text-emerald-400">{availableCount} buku</span>
                  </p>
                  <p className="text-slate-500 text-xs">Dipinjam: {booksInCat.length - availableCount}</p>
                </div>

                {topRated.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs mb-1">Buku Populer:</p>
                    {topRated.map((book) => (
                      <div key={book.id} className="flex items-center gap-2">
                        <BookMarked size={12} className="text-blue-400 flex-shrink-0" />
                        <p className="text-slate-300 text-xs truncate flex-1">{book.title}</p>
                        <div className="flex items-center gap-0.5">
                          <StarIcon size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-slate-400 text-xs">{book.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 text-slate-300 text-xs hover:bg-white/5 transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingCategory(cat); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/20 text-rose-400 text-xs hover:bg-rose-500/10 transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Category Detail Modal ── */}
      {selectedCategory && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-br ${gradients[selectedCategory.id] ?? defaultGradient} p-6 rounded-t-2xl`}>
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  {(() => {
                    const Icon = iconMap[selectedCategory.icon] ?? BookOpen;
                    return <Icon size={28} className="text-white" />;
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingCategory(selectedCategory); setSelectedCategory(null); }}
                    className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => { setDeletingCategory(selectedCategory); setSelectedCategory(null); }}
                    className="p-2 rounded-xl bg-white/20 text-white hover:bg-rose-500/40 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <h2 className="text-white text-2xl mt-4" style={{ fontWeight: 700 }}>{selectedCategory.name}</h2>
              <p className="text-white/70 text-sm mt-1">{selectedCategory.description}</p>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-white text-xl" style={{ fontWeight: 700 }}>{getBooksInCategory(selectedCategory.id).length}</p>
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
              <p className="text-blue-400 text-sm mb-3" style={{ fontWeight: 600 }}>
                Koleksi dalam Kategori Ini
              </p>
              <div className="space-y-3">
                {getBooksInCategory(selectedCategory.id).map((book) => (
                  <div key={book.id} className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl">
                    <img src={book.cover} alt={book.title} className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate" style={{ fontWeight: 600 }}>{book.title}</p>
                      <p className="text-slate-400 text-xs">{book.author} · {book.year}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarIcon size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-slate-400 text-xs">{book.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${book.available ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                        style={{ fontWeight: 500 }}
                      >
                        {book.available ? "Tersedia" : "Dipinjam"}
                      </span>
                      <span className="text-slate-500 text-xs">Stok: {book.stock}</span>
                    </div>
                  </div>
                ))}
                {getBooksInCategory(selectedCategory.id).length === 0 && (
                  <div className="text-center py-6">
                    <BookOpen size={28} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Belum ada buku di kategori ini</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {editingCategory && (
        <CategoryFormModal
          initial={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deletingCategory && (
        <DeleteConfirmModal
          category={deletingCategory}
          onCancel={() => setDeletingCategory(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
