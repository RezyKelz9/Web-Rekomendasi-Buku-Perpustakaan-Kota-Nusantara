import { useState, useCallback, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Tag,
  Clock,
  User,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  BookMarked,
  ShoppingCart,
  Trash2,
  LogOut,
  CheckCircle,
  AlertCircle,
  BookCheck,
} from "lucide-react";
import { Book } from "../data/libraryData";
import { useAuth } from "../context/AuthContext";
import { createLoanRecord, getLoanDurationByMemberType, getOutstandingFineForUser, loadLoans, saveLoans, calculateFine, getOverdueDays, getRemainingDays, formatLoanDate } from "../utils/loanUtils";
import type { LoanRecord } from "../utils/loanUtils";
import { loanApi } from "../services/loanApi";

// ─── Notification Types ─────────────────────────────────────────────────────

interface NotifItem {
  id: string;
  type: "warning" | "overdue";
  title: string;
  message: string;
  loanId: string;
}

// ─── Toast System ────────────────────────────────────────────────────────────

type ToastType = "success" | "warning" | "confirm";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

let toastIdCounter = 0;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount → slide in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // auto dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 350);
    }, toast.type === "confirm" ? 4000 : 3000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [toast.id, toast.type, onDismiss]);

  const styles: Record<ToastType, { bg: string; border: string; icon: JSX.Element }> = {
    success: {
      bg: "bg-white",
      border: "border-sky-200",
      icon: <BookCheck size={18} className="text-sky-500 flex-shrink-0" />,
    },
    warning: {
      bg: "bg-white",
      border: "border-amber-200",
      icon: <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />,
    },
    confirm: {
      bg: "bg-[#0c3558]",
      border: "border-sky-700",
      icon: <CheckCircle size={20} className="text-sky-300 flex-shrink-0" />,
    },
  };

  const s = styles[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl
        transition-all duration-350 ease-out max-w-sm w-full
        ${s.bg} ${s.border}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}
      `}
      style={{ minWidth: 280 }}
    >
      {s.icon}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${toast.type === "confirm" ? "text-white" : "text-sky-900"}`}
          style={{ fontWeight: 600 }}
        >
          {toast.title}
        </p>
        {toast.message && (
          <p className={`text-xs mt-0.5 ${toast.type === "confirm" ? "text-sky-300" : "text-slate-400"}`}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 350); }}
        className={`flex-shrink-0 mt-0.5 transition-colors ${toast.type === "confirm" ? "text-sky-400 hover:text-white" : "text-slate-300 hover:text-sky-500"}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

const navItems = [
  { to: "/user", label: "Beranda", icon: LayoutDashboard },
  { to: "/user/books", label: "Menu Buku", icon: BookOpen },
  { to: "/user/shelves", label: "Tempat Rak Buku", icon: Library },
  { to: "/user/categories", label: "Kategori Buku", icon: Tag },
  { to: "/user/loan-info", label: "Waktu Peminjaman", icon: Clock },
  { to: "/user/account", label: "Akun Saya", icon: User },
];

// ─── Layout ──────────────────────────────────────────────────────────────────

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookshelf, setBookshelf] = useState<Book[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userInitial = user?.namaLengkap?.charAt(0).toUpperCase() ?? "A";

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    const loans = loadLoans().filter((l) => l.userId === user.id && l.status === "Dipinjam");
    const items: NotifItem[] = [];
    for (const loan of loans) {
      const remaining = getRemainingDays(loan.dueDate);
      if (remaining < 0) {
        const overdue = getOverdueDays(loan.dueDate);
        const fine = calculateFine(user.jenisAnggota || "Umum", overdue, loan.isFavorite);
        items.push({
          id: `overdue-${loan.id}`,
          type: "overdue",
          title: "Terlambat Mengembalikan",
          message: `"${loan.title}" — Telat ${overdue} hari, denda Rp ${fine.toLocaleString("id-ID")}`,
          loanId: loan.id,
        });
      } else if (remaining <= 3) {
        const label = remaining === 0 ? "hari ini" : `${remaining} hari lagi`;
        items.push({
          id: `near-${loan.id}`,
          type: "warning",
          title: "Jatuh Tempo Segera",
          message: `"${loan.title}" — Jatuh tempo ${label} (${formatLoanDate(loan.dueDate)})`,
          loanId: loan.id,
        });
      }
    }
    setNotifications(items);
  }, [user]);

  const toggleNotif = () => {
    setNotifOpen((prev) => !prev);
  };

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/select-role");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSidebarOpen(false);
    }
  };

  const addToBookshelf = (book: Book) => {
    const isExist = bookshelf.find((b) => b.id === book.id);
    if (isExist) {
      showToast("warning", `"${book.title}" sudah ada di keranjang pinjaman`);
    } else {
      setBookshelf([...bookshelf, book]);
      showToast("success", `"${book.title}" telah masuk ke keranjang pinjaman`);
    }
  };

  const removeFromBookshelf = (bookId: string) => {
    setBookshelf(bookshelf.filter((b) => b.id !== bookId));
  };

  return (
    <div className="min-h-screen bg-sky-50 flex">
      {/* Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0c3558] z-30 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-sky-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookMarked size={20} className="text-sky-900" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Perpustakaan</p>
            <p className="text-sky-400 text-xs">Kota Nusantara</p>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-white/40 text-xs px-3 mb-3 uppercase tracking-widest">Menu Utama</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/user"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group
                ${isActive
                  ? "bg-sky-400 text-sky-900 font-semibold shadow"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-sky-900" : "text-white/50 group-hover:text-white"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom info */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center text-sky-900 font-bold text-sm flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.namaLengkap ?? "Anggota"}</p>
              <p className="text-white/40 text-xs truncate">{user?.jenisAnggota ?? "Anggota Aktif"}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="text-white/40 hover:text-rose-400 transition-colors flex-shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-sky-100 px-4 lg:px-8 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg text-sky-900 hover:bg-sky-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul buku, penulis..."
                className="w-full pl-9 pr-4 py-2 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 placeholder-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 relative">
            <button
              onClick={toggleNotif}
              className="relative p-2 rounded-xl text-sky-700 hover:bg-sky-50"
              title="Notifikasi"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-sky-100 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-sky-100">
                    <p className="text-sky-900 text-sm font-bold">Notifikasi</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={28} className="text-sky-200 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-sky-50">
                      {notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-sky-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            {n.type === "overdue" ? (
                              <AlertCircle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${n.type === "overdue" ? "text-rose-700" : "text-amber-700"}`}>
                                {n.title}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl text-sky-700 hover:bg-sky-50"
            >
              <ShoppingCart size={20} />
              {bookshelf.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {bookshelf.length}
                </span>
              )}
            </button>
            <NavLink to="/user/account">
              <div className="w-9 h-9 ml-1 rounded-full bg-sky-400 flex items-center justify-center text-sky-900 font-bold text-sm cursor-pointer hover:bg-sky-500 transition-colors">
                {userInitial}
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet context={{ addToBookshelf }} />
        </main>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-sky-100">
              <div className="flex items-center gap-2 text-sky-900">
                <ShoppingCart size={20} />
                <h2 className="text-lg font-bold">Rak Pinjaman</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 text-slate-400 hover:text-sky-600 rounded-full hover:bg-sky-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {bookshelf.length === 0 ? (
                <div className="text-center py-10">
                  <Library size={48} className="text-sky-100 mx-auto mb-4" />
                  <p className="text-sky-900 font-semibold mb-1">Rak Masih Kosong</p>
                  <p className="text-slate-500 text-sm">Cari buku di Menu Buku dan tambahkan ke sini.</p>
                  <button
                    onClick={() => { setCartOpen(false); navigate("/user/books"); }}
                    className="mt-6 text-sky-600 text-sm font-semibold hover:underline"
                  >
                    Mulai Eksplorasi
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookshelf.map((book) => (
                    <div key={book.id} className="flex gap-4 p-3 bg-sky-50/50 rounded-xl border border-sky-100 relative group">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-16 h-20 object-cover rounded-lg shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sky-900 text-sm font-bold truncate pr-6">{book.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{book.author}</p>
                        <div className="mt-2 text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded inline-block font-semibold">
                          {book.year}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromBookshelf(book.id)}
                        className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Hapus dari Rak"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {bookshelf.length > 0 && (
              <div className="p-5 border-t border-sky-100 bg-sky-50/30">
                <p className="text-sm text-slate-500 mb-4 text-center">
                  Anda akan meminjam <span className="font-bold text-sky-900">{bookshelf.length} buku</span>.
                </p>
                <button
                  onClick={async () => {
                    if (user) {
                      const outstandingFine = getOutstandingFineForUser(user.id);
                      if (outstandingFine > 0) {
                        showToast(
                          "warning",
                          "Peminjaman tidak dapat diproses",
                          `Anda masih memiliki denda keterlambatan sebesar Rp ${outstandingFine.toLocaleString("id-ID")}. Silakan lunasi denda terlebih dahulu.`
                        );
                        return;
                      }

                      const duration = getLoanDurationByMemberType(user.jenisAnggota || "Umum");
                      const newLoans: LoanRecord[] = [];

                      // Coba API dulu
                      let apiOk = false;
                      const results = await Promise.allSettled(
                        bookshelf.map((b) =>
                          loanApi.create({
                            userId: user.id,
                            bookId: b.id,
                            duration,
                            userName: user.namaLengkap,
                            userType: user.jenisAnggota || "Umum",
                            isFavorite: b.recommended,
                          })
                        )
                      );
                      results.forEach((r, i) => {
                        if (r.status === "fulfilled" && r.value) {
                          newLoans.push(r.value);
                          apiOk = true;
                        }
                      });

                      // Jika API gagal, fallback ke localStorage
                      if (!apiOk) {
                        for (const b of bookshelf) {
                          const rec = createLoanRecord(b, user.id, duration);
                          rec.userName = user.namaLengkap;
                          rec.userType = user.jenisAnggota || "Umum";
                          rec.isFavorite = b.recommended;
                          newLoans.push(rec);
                        }
                      }

                      if (newLoans.length > 0) {
                        const allLoans = loadLoans();
                        saveLoans([...allLoans, ...newLoans]);
                      }
                    }
                    const count = bookshelf.length;
                    setBookshelf([]);
                    setCartOpen(false);
                    showToast(
                      "confirm",
                      "Peminjaman berhasil dikonfirmasi!",
                      `${count} buku siap diambil di meja layanan perpustakaan.`
                    );
                  }}
                  className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold tracking-wider hover:bg-sky-700 transition-colors"
                >
                  KONFIRMASI PINJAMAN
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
