import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function LoginAdmin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const result = await login(form.email, form.password, "admin");
      if (result.success && result.role === "admin") {
        navigate("/admin");
      } else if (result.success) {
        setError("Akun ini bukan administrator. Gunakan portal anggota untuk masuk.");
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-white/10">
          <div className="bg-slate-950 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">Perpustakaan Kota Nusantara Admin</h1>
            <p className="text-blue-500 text-sm mt-1">Portal Administrasi</p>
          </div>

          <div className="px-8 py-8">
            <h2 className="text-white text-xl font-bold mb-1">Masuk sebagai Admin</h2>
            <p className="text-slate-500 text-sm mb-7">Hanya personel berwenang yang dapat mengakses panel ini.</p>

            {error && (
              <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl px-4 py-3 mb-5">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1.5">Email Administrator</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@perpus.local" autoComplete="email" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition" />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Masukkan kata sandi" autoComplete="current-password" className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
                {loading ? <span className="w-5 h-5 border-2 border-slate-900/30 border-t-white rounded-full animate-spin" /> : <><Shield size={18} /> Akses Panel Admin</>}
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              Belum memiliki akun admin?{" "}
              <Link to="/register-admin" className="text-blue-500 font-semibold hover:underline">Ajukan Pendaftaran</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">© {currentYear} Perpustakaan Kota Nusantara. Akses terbatas.</p>
      </div>
    </div>
  );
}

