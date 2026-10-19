import { Link } from "react-router";
import { User, ShieldCheck, ArrowRight } from "lucide-react";

export function SelectRole() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="rounded-[2rem] bg-white shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-0">
            <div className="bg-slate-950 p-10 text-white flex flex-col justify-center gap-6">
              <div>
                <p className="text-sky-400 text-sm uppercase tracking-[0.22em] mb-3">Pilih Role</p>
                <h1 className="text-3xl font-bold">Masuk sebagai User atau Admin</h1>
              </div>
              <p className="text-slate-300 leading-relaxed">Pilih akses yang sesuai sebelum memasuki aplikasi. User akan masuk ke halaman peminjam, sedangkan admin akan masuk ke dashboard administrasi.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login?role=user"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-6 py-4 text-slate-950 font-semibold hover:bg-sky-300 transition"
                >
                  <User size={18} /> User
                </Link>
                <Link
                  to="/login-admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-white font-semibold hover:bg-white/20 transition"
                >
                  <ShieldCheck size={18} /> Admin
                </Link>
              </div>
            </div>
            <div className="p-10">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <p className="text-slate-900 text-lg font-semibold mb-3">Langkah selanjutnya</p>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-3">
                    <ArrowRight size={16} className="mt-1 text-sky-500" />
                    Pilih role sesuai kebutuhan akses.
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight size={16} className="mt-1 text-sky-500" />
                    Masuk dengan akun yang sudah terdaftar.
                  </li>
                  <li className="flex items-start gap-3">
                    <ArrowRight size={16} className="mt-1 text-sky-500" />
                    Sistem akan menampilkan halaman peminjam atau admin sesuai role.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
