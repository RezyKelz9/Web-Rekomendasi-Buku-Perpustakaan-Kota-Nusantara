import { useState, useEffect } from "react";
import { Users, Search, Trash2, Mail, ShieldCheck, UserCheck, Clock, Ban } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";
import { addActivity } from "../../utils/activityHistory";

interface Member {
  id: string | number;
  nama_lengkap: string;
  email: string;
  username?: string;
  nip?: string;
  nomor_hp?: string;
  alamat?: string;
  jenis_anggota?: string;
  membership_type?: string;
  member_code?: string;
  role: string;
  status: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active: { label: "Aktif", className: "bg-emerald-500/20 text-emerald-400", icon: <UserCheck size={12} /> },
  pending: { label: "Pending", className: "bg-amber-500/20 text-amber-400", icon: <Clock size={12} /> },
  inactive: { label: "Nonaktif", className: "bg-slate-500/20 text-slate-400", icon: <Ban size={12} /> },
  blocked: { label: "Diblokir", className: "bg-rose-500/20 text-rose-400", icon: <Ban size={12} /> },
};

export function AdminMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    authApi.fetchUsers().then(setMembers);
  }, []);

  const handleDelete = async (memberId: string | number, email: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${email}?`)) {
      const ok = await authApi.deleteUser(Number(memberId));
      if (ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        if (user) {
          addActivity(
            user.namaLengkap,
            user.email,
            "Anggota",
            "Hapus",
            `Menghapus akun anggota "${nama}" (${email})`,
          );
        }
      }
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      (m.nama_lengkap || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAdmin = members.filter((m) => m.role === "admin").length;
  const totalMember = members.filter((m) => m.role === "member").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-slate-400 text-sm">Manajemen Database</p>
          <h1 className="text-white text-2xl font-bold">Data Anggota & Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/20 px-4 py-2 text-blue-400 text-sm font-medium">
            <Users size={16} /> {totalAdmin} Admin, {totalMember} Anggota
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, email, atau username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition shadow-sm"
        />
      </div>

      <div className="rounded-3xl bg-slate-900 shadow-sm border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-6 py-4">Kode Anggota</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Jenis Anggota</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.map((member) => {
                const st = statusConfig[member.status] || statusConfig.active;
                return (
                  <tr key={member.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                        {member.member_code || (member.role === "admin" ? "ADM-—" : "UMM-—")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{member.nama_lengkap || "N/A"}</div>
                      {member.username && (
                        <div className="text-xs text-slate-500 mt-0.5">@{member.username}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-500" />
                        {member.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          member.role === "admin" ? "bg-blue-500 text-white" : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {member.role === "admin" && <ShieldCheck size={12} />}
                        {member.role === "admin" ? "ADMIN" : "MEMBER"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {member.jenis_anggota || member.membership_type || (member.role === "admin" ? "Staff" : "Umum")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${st.className}`}>
                        {st.icon}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(member.id, member.email, member.nama_lengkap || "N/A")}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Hapus Akun"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">
                    {members.length === 0 ? "Belum ada data akun yang terdaftar." : "Tidak ada hasil yang cocok dengan pencarian."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
