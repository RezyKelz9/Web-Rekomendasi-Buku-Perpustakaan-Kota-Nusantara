import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ShieldCheck, Eye, EyeOff, UserPlus, ChevronDown, BadgeCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const JABATAN_ADMIN = [
  "Superadmin",
  "Staff Perpustakaan",
  "Petugas Rak",
];

export function RegisterAdmin() {
  const navigate = useNavigate();
  const { registerAdmin } = useAuth();

  const [form, setForm] = useState({
    namaLengkap: "",
    email: "",
    username: "",
    password: "",
    jabatan: "",
    nip: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!form.namaLengkap.trim()) return "Nama Lengkap wajib diisi.";
    if (!form.email.trim()) return "Email wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Format email tidak valid.";
    if (!form.username.trim()) return "Username wajib diisi.";
    
    // Password validation: min 8 chars, upper, lower, number, symbol
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!form.password) return "Password wajib diisi.";
    if (!passwordRegex.test(form.password)) {
      return "Password minimal 8 karakter, kombinasi huruf besar-kecil, angka, dan simbol.";
    }
    
    if (!form.jabatan) return "Jabatan wajib dipilih.";
    if (!form.nip.trim()) return "NIP/ID Staff wajib diisi.";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    
    // Construct registration data with role 'admin'
    const adminData = {
      namaLengkap: form.namaLengkap,
      email: form.email,
      password: form.password,
      role: "admin",
      // Custom metadata for admin
      metadata: {
        username: form.username,
        jabatan: form.jabatan,
        nip: form.nip,
      }
    };

    setTimeout(async () => {
      // In a real app, this would be a specific admin registration endpoint
      // For now we use the general register but ensure role is 'admin'
      const result = await registerAdmin(adminData as any);
      if (result.success) {
        setSuccess("Registrasi Admin berhasil! Silakan login.");
        setTimeout(() => navigate("/login-admin"), 1500);
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {/* Header Admin */}
          <div className="bg-slate-950 px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 rotate-3">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Admin Registration</h1>
            <p className="text-blue-400 text-xs uppercase tracking-widest mt-1 font-semibold">Library Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl px-4 py-3 mb-6 flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3 mb-6 flex items-start gap-2">
                <BadgeCheck size={18} className="mt-0.5" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama & NIP Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="namaLengkap"
                    value={form.namaLengkap}
                    onChange={handleChange}
                    placeholder="Nama Admin"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                    NIP / ID Staff
                  </label>
                  <input
                    type="text"
                    name="nip"
                    value={form.nip}
                    onChange={handleChange}
                    placeholder="ID Resmi"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                </div>
              </div>

              {/* Email Institusi */}
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Email Institusi
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@perpus-umb.ac.id"
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                />
              </div>

              {/* Username & Jabatan Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="adm_xxxx"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                    Jabatan
                  </label>
                  <div className="relative">
                    <select
                      name="jabatan"
                      value={form.jabatan}
                      onChange={handleChange}
                      className="w-full appearance-none px-4 py-3 pr-10 bg-slate-800 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition cursor-pointer"
                    >
                      <option value="" disabled>Pilih Role...</option>
                      {JABATAN_ADMIN.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                  Password (Strict)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 8 karakter, Aa1!"
                    className="w-full px-4 py-3 pr-12 bg-slate-800 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all mt-4 transform active:scale-[0.98]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={20} />
                    Daftarkan Akun Admin
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Sudah punya akses admin?{" "}
                <Link to="/login?role=admin" className="text-blue-400 font-bold hover:underline">Log In</Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <Link to="/select-role" className="text-slate-500 text-xs font-medium hover:text-blue-400 transition-colors">
            ← Kembali ke Pemilihan Role
          </Link>
        </div>
      </div>
    </div>
  );
}
