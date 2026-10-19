import { Clock, AlertCircle, CheckCircle, RefreshCw, Banknote, Users, Info, Heart } from "lucide-react";
import { loanRules } from "../../data/libraryData";
import { loadSettings } from "../../utils/loanUtils";

const ruleColors = [
  {
    card: "border-sky-200 bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
    icon: "text-sky-600",
    bar: "bg-sky-400",
  },
  {
    card: "border-indigo-200 bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    icon: "text-indigo-600",
    bar: "bg-indigo-400",
  },
  {
    card: "border-green-200 bg-green-50",
    badge: "bg-green-100 text-green-700",
    icon: "text-green-600",
    bar: "bg-green-400",
  },
  {
    card: "border-rose-200 bg-rose-50",
    badge: "bg-rose-100 text-rose-700",
    icon: "text-rose-600",
    bar: "bg-rose-400",
  },
];

const procedures = [
  {
    step: 1,
    title: "Bawa KTP/Kartu Pelajar",
    desc: "Siapkan identitas diri yang masih berlaku untuk verifikasi keanggotaan.",
    icon: Users,
  },
  {
    step: 2,
    title: "Pilih Buku",
    desc: "Temukan buku yang ingin dipinjam sesuai rak dan kategorinya.",
    icon: CheckCircle,
  },
  {
    step: 3,
    title: "Daftar di Meja Petugas",
    desc: "Serahkan buku dan kartu identitas ke petugas perpustakaan.",
    icon: Clock,
  },
  {
    step: 4,
    title: "Tandatangani Formulir",
    desc: "Isi dan tandatangani formulir peminjaman dengan lengkap.",
    icon: CheckCircle,
  },
  {
    step: 5,
    title: "Kembalikan Tepat Waktu",
    desc: "Kembalikan buku sebelum jatuh tempo untuk menghindari denda.",
    icon: AlertCircle,
  },
];

export function LoanInfo() {
  const settings = loadSettings();
  const maxDuration = Math.max(settings.durasiUmum, settings.durasiPelajar, settings.durasiDosen, 90);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-sky-900 text-2xl" style={{ fontWeight: 700 }}>Waktu Peminjaman</h1>
        <p className="text-sky-500 text-sm mt-1">Informasi lengkap tentang aturan dan durasi peminjaman buku</p>
      </div>

      {/* Hero Info Card */}
      <div className="bg-gradient-to-br from-sky-600 to-sky-900 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Clock size={28} className="text-sky-200" />
          </div>
          <div>
            <h2 className="text-xl" style={{ fontWeight: 700 }}>Jam Operasional Perpustakaan</h2>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { day: "Senin – Jumat", time: "08.00 – 17.00" },
                { day: "Sabtu", time: "08.00 – 14.00" },
                { day: "Minggu & Libur", time: "Tutup" },
              ].map((s) => (
                <div key={s.day} className="bg-white/10 rounded-xl p-3">
                  <p className="text-sky-200 text-xs">{s.day}</p>
                  <p className="text-white text-sm" style={{ fontWeight: 600 }}>{s.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loan Rules */}
      <h2 className="text-sky-900 mb-4" style={{ fontWeight: 700 }}>Jenis & Durasi Peminjaman</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {loanRules.map((rule, idx) => {
          const c = ruleColors[idx % ruleColors.length];
          const barWidth = rule.duration > 0 ? Math.min((rule.duration / maxDuration) * 100, 100) : 0;
          const isFavoriteRule = rule.id === "4";

          return (
            <div key={rule.id} className={`rounded-2xl p-5 border ${c.card}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sky-900 text-base flex items-center gap-2" style={{ fontWeight: 700 }}>
                    {isFavoriteRule && <Heart size={16} className="text-rose-400 fill-rose-400" />}
                    {rule.type}
                  </h3>
                  <p className="text-sky-600 text-sm mt-0.5">{rule.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${c.badge} flex-shrink-0`} style={{ fontWeight: 700 }}>
                  {rule.duration > 0 ? `${rule.duration} hari` : `+Rp${rule.fine.toLocaleString("id-ID")}`}
                </span>
              </div>

              {/* Duration Bar */}
              {rule.duration > 0 && (
                <div className="mb-4">
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${barWidth}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sky-500 text-xs">0 hari</span>
                    <span className="text-sky-500 text-xs">{maxDuration} hari</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {!isFavoriteRule && (
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className={c.icon} />
                    <p className="text-sky-700 text-sm">
                      <span style={{ fontWeight: 600 }}>Perpanjangan:</span>{" "}
                      {rule.maxRenewals > 0 ? `${rule.maxRenewals}x` : "Tidak dapat diperpanjang"}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Banknote size={14} className={c.icon} />
                  <p className="text-sky-700 text-sm">
                    <span style={{ fontWeight: 600 }}>{isFavoriteRule ? "Tambahan denda:" : "Denda keterlambatan:"}</span>{" "}
                    {rule.fine === 0
                      ? "Tanpa denda (grace period)"
                      : `Rp${rule.fine.toLocaleString("id-ID")}/hari`
                    }
                  </p>
                </div>
                {!isFavoriteRule && (
                  <div className="flex items-center gap-2">
                    <Users size={14} className={c.icon} />
                    <p className="text-sky-700 text-sm">
                      <span style={{ fontWeight: 600 }}>Syarat:</span> {rule.eligibility}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Procedures */}
      <h2 className="text-sky-900 mb-4" style={{ fontWeight: 700 }}>Prosedur Peminjaman</h2>
      <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden mb-8">
        {procedures.map((proc, idx) => (
          <div key={proc.step} className={`flex items-start gap-4 p-5 ${idx !== procedures.length - 1 ? "border-b border-sky-50" : ""}`}>
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-sky-700 text-sm" style={{ fontWeight: 700 }}>{proc.step}</span>
            </div>
            <div className="flex-1">
              <p className="text-sky-900 text-sm" style={{ fontWeight: 700 }}>{proc.title}</p>
              <p className="text-sky-500 text-sm mt-0.5">{proc.desc}</p>
            </div>
            <proc.icon size={18} className="text-sky-300 flex-shrink-0 mt-0.5" />
          </div>
        ))}
      </div>

      {/* Important Notes */}
      <div className="bg-sky-50 rounded-2xl border border-sky-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={20} className="text-sky-600" />
          <h2 className="text-sky-900" style={{ fontWeight: 700 }}>Ketentuan Penting</h2>
        </div>
        <ul className="space-y-2">
          {[
            `Umum: max ${settings.durasiUmum} hari, denda Rp${settings.dendaUmum.toLocaleString("id-ID")}/hari`,
            `Pelajar: max ${settings.durasiPelajar} hari, denda Rp${settings.dendaPelajar.toLocaleString("id-ID")}/hari`,
            `Dosen: max ${settings.durasiDosen} hari, tanpa denda (grace period)`,
            `Buku Favorit: tambahan denda Rp${settings.dendaBukuFavorit.toLocaleString("id-ID")}/hari di atas denda anggota`,
            "Perpanjangan peminjaman dapat dilakukan 1 hari sebelum jatuh tempo.",
            "Buku yang hilang wajib diganti dengan buku yang sama atau senilai harga buku.",
            "Denda keterlambatan dihitung per hari kalender.",
            "Anggota yang memiliki denda belum lunas tidak dapat meminjam buku baru.",
          ].map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle size={14} className="text-sky-400 mt-0.5 flex-shrink-0" />
              <p className="text-sky-700 text-sm">{note}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact CTA */}
      <div className="mt-6 bg-gradient-to-r from-sky-500 to-sky-700 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white" style={{ fontWeight: 700 }}>Ada pertanyaan tentang peminjaman?</p>
          <p className="text-sky-200 text-sm mt-0.5">Hubungi petugas kami di meja layanan lantai 1.</p>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-white">📞 (021) 555-1234</p>
          <p className="text-sky-200">perpustakaan@nusan.go.id</p>
        </div>
      </div>
    </div>
  );
}
