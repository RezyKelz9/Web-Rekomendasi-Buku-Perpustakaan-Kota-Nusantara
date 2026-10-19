import { useState } from "react";
import { Navigate, Outlet, NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  BookOpen,
  Users,
  BookMarked,
  Layers,
  BarChart,
  Settings,
  LayoutDashboard,
  Library,
  Menu,
  X,
  ChevronRight,
  History,
} from "lucide-react";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/books", label: "Buku", icon: BookOpen },
  { to: "/admin/members", label: "Anggota", icon: Users },
  { to: "/admin/loans", label: "Peminjaman", icon: BookMarked },
  { to: "/admin/shelves", label: "Rak Buku", icon: Library },
  { to: "/admin/categories", label: "Kategori", icon: Layers },
  { to: "/admin/reports", label: "Laporan", icon: BarChart },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings },
  { to: "/admin/history", label: "Riwayat", icon: History },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/select-role");
  };

  const userInitial = user.namaLengkap?.charAt(0).toUpperCase() ?? "A";

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-30 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookMarked size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Perpustakaan</p>
            <p className="text-blue-400 text-xs">Panel Admin</p>
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
          <p className="text-white/40 text-xs px-3 mb-3 uppercase tracking-widest">Menu Admin</p>
          {adminNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group
                ${isActive
                  ? "bg-blue-500 text-white font-semibold shadow"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-white" : "text-white/50 group-hover:text-white"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.namaLengkap}</p>
              <p className="text-white/40 text-xs truncate">Administrator</p>
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
        <header className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 px-4 lg:px-8 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex-1">
            <span className="text-white font-semibold text-sm">Panel Administrasi Perpustakaan</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {userInitial}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
