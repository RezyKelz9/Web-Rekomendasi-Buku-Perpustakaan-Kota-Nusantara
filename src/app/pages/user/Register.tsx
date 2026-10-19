import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { BookMarked, Eye, EyeOff, UserPlus, ChevronDown } from "lucide-react";
import { useAuth, RegisterData } from "../../context/AuthContext";

const JENIS_ANGGOTA = [
  "Umum",
  "Pelajar",
  "Dosen/Pengajar",
];

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState<RegisterData>({
    namaLengkap: "",
    email: "",
    password: "",
    nomorHP: "",
    alamat: "",
    jenisAnggota: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!form.namaLengkap.trim()) return "Nama Lengkap wajib diisi.";
    if (!form.email.trim()) return "Email wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Format email tidak valid.";
    if (!form.password) return "Password wajib diisi.";
    if (form.password.length < 6) return "Password minimal 6 karakter.";
    if (!form.nomorHP.trim()) return "Nomor HP wajib diisi.";
    if (!/^[0-9+\s-]{8,15}$/.test(form.nomorHP)) return "Nomor HP tidak valid.";
    if (!form.alamat.trim()) return "Alamat wajib diisi.";
    if (!form.jenisAnggota) return "Jenis Anggota wajib dipilih.";
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
    setTimeout(async () => {
      const result = await register(form);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(result.message);
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
          <div className="bg-[#0c3558] px-8 py-8 text-center">
            <div className="w-14 h-14 bg-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <BookMarked size={28} className="text-sky-900" />
            </div>
            <h1 className="text-white text-xl font-bold">Daftar Anggota</h1>
            <p className="text-sky-300 text-sm mt-0.5">Perpustakaan Kota Nusantara</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <h2 className="text-sky-900 text-lg font-bold mb-1">Buat Akun Baru</h2>
            <p className="text-slate-400 text-sm mb-6">Lengkapi data diri Anda untuk mendaftar</p>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl px-4 py-3 mb-5">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-sky-900 text-sm font-semibold mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="namaLengkap"
                  value={form.namaLengkap}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
                />
              </div>

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
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
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

              {/* Nomor HP */}
              <div>
                <label className="block text-sky-900 text-sm font-semibold mb-1.5">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  name="nomorHP"
                  value={form.nomorHP}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sky-900 text-sm font-semibold mb-1.5">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap"
                  rows={2}
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition resize-none"
                />
              </div>

              {/* Jenis Anggota */}
              <div>
                <label className="block text-sky-900 text-sm font-semibold mb-1.5">
                  Jenis Anggota
                </label>
                <div className="relative">
                  <select
                    name="jenisAnggota"
                    value={form.jenisAnggota}
                    onChange={handleChange}
                    className="w-full appearance-none px-4 py-3 pr-10 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition cursor-pointer"
                  >
                    <option value="" disabled>Pilih jenis anggota...</option>
                    {JENIS_ANGGOTA.map((jenis) => (
                      <option key={jenis} value={jenis}>{jenis}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                    <UserPlus size={18} />
                    Daftar Sekarang
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-slate-500 text-sm mt-5">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-sky-600 font-semibold hover:underline">
                Masuk di sini
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
