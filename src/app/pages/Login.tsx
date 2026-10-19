import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { BookMarked, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const params = new URLSearchParams(location.search);
  const selectedRole = params.get("role") === "admin" ? "admin" : "user";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      const result = await login(form.email, form.password, "member");
      if (result.success && result.role) {
        if (selectedRole === "admin" && result.role !== "admin") {
          setError("Akun ini bukan admin. Pilih role User atau gunakan akun admin.");
        } else if (selectedRole === "user" && result.role === "admin") {
          setError("Akun admin tidak dapat masuk sebagai User. Pilih role Admin.");
        } else {
          if (result.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/user");
          }
        }
      } else if (!result.success) {
        setError(result.message);
      } else {
        setError("Terjadi kesalahan saat login.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#0c3558] px-8 py-10 text-center">
            <div className="w-16 h-16 bg-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookMarked size={32} className="text-sky-900" />
            </div>
            <h1 className="text-white text-2xl font-bold">Perpustakaan</h1>
            <p className="text-sky-300 text-sm mt-1">Kota Nusantara</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-sky-900 text-xl font-bold mb-1">Selamat Datang</h2>
            <p className="text-slate-400 text-sm mb-7">Masuk untuk mengakses perpustakaan digital</p>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sky-900 text-sm font-semibold mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contoh@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sky-900 text-sm font-semibold mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Masuk
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <p className="text-center text-slate-500 text-sm mt-6">
              Belum punya akun?{" "}
              <Link
                to={selectedRole === "admin" ? "/register-admin" : "/register"}
                className="text-sky-600 font-semibold hover:underline"
              >
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © {currentYear} Perpustakaan Kota Nusantara
        </p>
      </div>
    </div>
  );
}
