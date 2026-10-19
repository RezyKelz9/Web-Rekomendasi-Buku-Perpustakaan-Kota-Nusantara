import { useState } from "react";
import {
  Plus, Pencil, Trash2, X, MapPin, BookOpen,
  Layers, ArrowUpRight, Save, AlertTriangle,
} from "lucide-react";
import { shelves as initialShelves, books, Shelf } from "../../data/libraryData";
import { useAuth } from "../../context/AuthContext";
import { addActivity } from "../../utils/activityHistory";

const getBookCountOnShelf = (shelfId: string) =>
  books.filter((b) => b.shelfId === shelfId).length;

const floorColors: Record<number, string> = {
  1: "bg-blue-500/10 border-blue-500/20",
  2: "bg-indigo-500/10 border-indigo-500/20",
  3: "bg-cyan-500/10 border-cyan-500/20",
};

const floorBadgeColors: Record<number, string> = {
  1: "bg-blue-500/20 text-blue-400",
  2: "bg-indigo-500/20 text-indigo-400",
  3: "bg-cyan-500/20 text-cyan-400",
};

const emptyShelf: Omit<Shelf, "id"> = {
  name: "",
  location: "",
  floor: 1,
  categories: [],
  capacity: 100,
  occupied: 0,
};

const getShelfOccupied = (shelfId: string) => getBookCountOnShelf(shelfId);

/* ── ShelfFormModal ── */
function ShelfFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Shelf | (Omit<Shelf, "id"> & { id?: string });
  onClose: () => void;
  onSave: (shelf: Shelf) => void;
}) {
  const [form, setForm] = useState<Omit<Shelf, "id"> & { id?: string }>(initial);
  const isEdit = Boolean(initial.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (form as any).id ?? `shelf-${Date.now()}`;
    onSave({ ...form, id } as Shelf);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl rounded-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-blue-500 text-xs tracking-widest uppercase mb-0.5" style={{ fontWeight: 600 }}>
              {isEdit ? "Edit Data" : "Tambah Baru"}
            </p>
            <h2 className="text-white text-lg" style={{ fontWeight: 700 }}>
              {isEdit ? "Edit Rak" : "Tambah Rak Baru"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-blue-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Nama Rak
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Rak A"
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div className="col-span-2">
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Lokasi
              </label>
              <input
                required
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Contoh: Lantai 1 – Sayap Kiri"
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Lantai
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: Number(e.target.value) }))}
                className="mt-1 w-full px-3 py-2.5 border-b-2 border-blue-500/30 focus:border-blue-500 bg-transparent text-sm text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontWeight: 600 }}>
                Kapasitas (buku)
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
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
              <Save size={16} /> {isEdit ? "SIMPAN PERUBAHAN" : "TAMBAH RAK"}
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

/* ── Delete Confirm Modal ── */
function DeleteConfirmModal({
  shelf,
  onCancel,
  onConfirm,
}: {
  shelf: Shelf;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 w-full max-w-sm shadow-2xl p-6 rounded-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-rose-400" />
        </div>
        <h3 className="text-white text-lg mb-1" style={{ fontWeight: 700 }}>
          Hapus rak ini?
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          <span style={{ fontWeight: 600 }}>{shelf.name}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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
   Main AdminShelves Page
════════════════════════════════════════════════════════════════ */
export function AdminShelves() {
  const { user } = useAuth();
  const [shelves, setShelves] = useState<Shelf[]>(initialShelves);
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [editingShelf, setEditingShelf] = useState<Shelf | Omit<Shelf, "id"> | null>(null);
  const [deletingShelf, setDeletingShelf] = useState<Shelf | null>(null);

  const floors = [...new Set(shelves.map((s) => s.floor))].sort();

  const getBooksOnShelf = (shelfId: string) =>
    books.filter((b) => b.shelfId === shelfId);

  const handleSave = (shelf: Shelf) => {
    const exists = shelves.some((s) => s.id === shelf.id);
    setShelves((prev) => {
      return exists ? prev.map((s) => (s.id === shelf.id ? shelf : s)) : [...prev, shelf];
    });
    if (user) {
      addActivity(
        user.namaLengkap,
        user.email,
        "Rak",
        exists ? "Edit" : "Tambah",
        exists
          ? `Mengedit rak "${shelf.name}" – ${shelf.location}`
          : `Menambahkan rak baru "${shelf.name}" – ${shelf.location}`,
      );
    }
    setEditingShelf(null);
    setSelectedShelf(null);
  };

  const handleDelete = () => {
    if (!deletingShelf) return;
    setShelves((prev) => prev.filter((s) => s.id !== deletingShelf.id));
    if (user) {
      addActivity(
        user.namaLengkap,
        user.email,
        "Rak",
        "Hapus",
        `Menghapus rak "${deletingShelf.name}" dari lantai ${deletingShelf.floor}`,
      );
    }
    setDeletingShelf(null);
    setSelectedShelf(null);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-blue-500 text-xs tracking-widest uppercase mb-1" style={{ fontWeight: 600 }}>
            Manajemen Rak
          </p>
          <h1 className="text-white text-3xl" style={{ fontWeight: 700 }}>
            Kelola Rak Buku
          </h1>
        </div>
        <button
          onClick={() => setEditingShelf(emptyShelf)}
          className="inline-flex items-center justify-center gap-2 bg-blue-500 px-5 py-3 text-white text-sm hover:bg-blue-400 transition-colors rounded-xl"
          style={{ fontWeight: 700, letterSpacing: "0.05em" }}
        >
          <Plus size={16} /> TAMBAH RAK
        </button>
      </div>

      {/* ── Floor Filter ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedFloor("all")}
          className={`px-4 py-2 rounded-xl text-sm transition-colors ${
            selectedFloor === "all"
              ? "bg-blue-500 text-white"
              : "bg-slate-900 border border-white/10 text-slate-300 hover:bg-white/5"
          }`}
          style={{ fontWeight: 500 }}
        >
          Semua Lantai
        </button>
        {floors.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFloor(f)}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              selectedFloor === f
                ? "bg-blue-500 text-white"
                : "bg-slate-900 border border-white/10 text-slate-300 hover:bg-white/5"
            }`}
            style={{ fontWeight: 500 }}
          >
            Lantai {f}
          </button>
        ))}
      </div>

      {/* ── Floor Maps ── */}
      {(selectedFloor === "all" ? floors : [selectedFloor]).map((floor) => {
        const floorShelves = shelves.filter((s) => s.floor === floor);
        return (
          <div key={floor} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`px-3 py-1 rounded-full text-sm ${floorBadgeColors[floor] ?? "bg-slate-800 text-slate-300"}`}
                style={{ fontWeight: 600 }}
              >
                Lantai {floor}
              </div>
              <p className="text-slate-400 text-sm">{floorShelves.length} rak buku</p>
            </div>

            <div className={`rounded-2xl p-5 border mb-4 ${floorColors[floor] ?? "bg-slate-800 border-white/10"}`}>
              <div className="flex items-start gap-2 mb-3">
                <Layers size={16} className="text-blue-400 mt-0.5" />
                <p className="text-white text-sm" style={{ fontWeight: 600 }}>
                  Denah Lantai {floor}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {floorShelves.map((shelf) => {
                  const realOccupied = getShelfOccupied(shelf.id);
                  const occupancy = Math.round((realOccupied / shelf.capacity) * 100);
                  return (
                    <div key={shelf.id} className="bg-slate-900 rounded-xl p-4 border border-white/10 shadow-sm hover:shadow-md transition-all group relative">
                      {/* Admin controls */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingShelf(shelf)}
                          className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                          title="Edit rak"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeletingShelf(shelf)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-colors"
                          title="Hapus rak"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <button
                        className="text-left w-full"
                        onClick={() => setSelectedShelf(shelf)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-blue-400 text-sm" style={{ fontWeight: 700 }}>
                              {shelf.id}
                            </span>
                          </div>
                          <ArrowUpRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-white text-sm" style={{ fontWeight: 700 }}>{shelf.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{shelf.location}</p>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Kapasitas</span>
                            <span className="text-blue-400" style={{ fontWeight: 600 }}>{occupancy}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                occupancy > 80 ? "bg-rose-400" : occupancy > 60 ? "bg-blue-400" : "bg-green-400"
                              }`}
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                          <p className="text-slate-500 text-xs mt-1">{realOccupied}/{shelf.capacity} buku</p>
                        </div>
                      </button>
                    </div>
                  );
                })}

                {floorShelves.length === 0 && (
                  <p className="col-span-full text-slate-500 text-sm text-center py-6">
                    Belum ada rak di lantai ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Keterangan Kapasitas ── */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-white/10 shadow-sm mt-2">
        <p className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>Keterangan Kapasitas Rak</p>
        <div className="flex flex-wrap gap-4">
          {[
            { color: "bg-green-400", label: "Di bawah 60% – Masih longgar" },
            { color: "bg-blue-400", label: "60%–80% – Cukup penuh" },
            { color: "bg-rose-400", label: "Di atas 80% – Hampir penuh" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-1.5 rounded-full ${item.color}`} />
              <p className="text-slate-400 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Shelf Detail Modal ── */}
      {selectedShelf && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedShelf(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-3">
                    <span className="text-blue-400 text-xl" style={{ fontWeight: 700 }}>
                      {selectedShelf.id}
                    </span>
                  </div>
                  <h2 className="text-white text-xl" style={{ fontWeight: 700 }}>
                    {selectedShelf.name}
                  </h2>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-slate-400" />
                    <p className="text-slate-400 text-sm">{selectedShelf.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingShelf(selectedShelf); setSelectedShelf(null); }}
                    className="p-2 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="Edit rak"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => { setDeletingShelf(selectedShelf); setSelectedShelf(null); }}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Hapus rak"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedShelf(null)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Kapasitas", value: selectedShelf.capacity },
                  { label: "Terisi", value: getShelfOccupied(selectedShelf.id) },
                  { label: "Kosong", value: selectedShelf.capacity - getShelfOccupied(selectedShelf.id) },
                ].map((stat) => (
                  <div key={stat.label} className="bg-blue-500/10 rounded-xl p-3 text-center">
                    <p className="text-white text-lg" style={{ fontWeight: 700 }}>{stat.value}</p>
                    <p className="text-slate-400 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-blue-400 text-sm mb-3" style={{ fontWeight: 600 }}>
                  Buku di {selectedShelf.name} ({getBooksOnShelf(selectedShelf.id).length} buku)
                </p>
                <div className="space-y-2">
                  {getBooksOnShelf(selectedShelf.id).map((book) => (
                    <div key={book.id} className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl">
                      <img src={book.cover} alt={book.title} className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate" style={{ fontWeight: 600 }}>{book.title}</p>
                        <p className="text-slate-400 text-xs truncate">{book.author}</p>
                        <p className="text-slate-500 text-xs mt-0.5">Posisi: {book.shelfPosition}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            book.available ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {book.available ? "Tersedia" : "Dipinjam"}
                        </div>
                        <p className="text-slate-500 text-xs">Stok: {book.stock}</p>
                      </div>
                    </div>
                  ))}
                  {getBooksOnShelf(selectedShelf.id).length === 0 && (
                    <div className="text-center py-6">
                      <BookOpen size={28} className="text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Belum ada buku di rak ini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {editingShelf && (
        <ShelfFormModal
          initial={editingShelf}
          onClose={() => setEditingShelf(null)}
          onSave={handleSave}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deletingShelf && (
        <DeleteConfirmModal
          shelf={deletingShelf}
          onCancel={() => setDeletingShelf(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
