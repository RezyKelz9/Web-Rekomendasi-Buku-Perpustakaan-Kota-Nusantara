import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, AlertCircle, ArrowLeft, Loader } from "lucide-react";
import { loadLoans, saveLoans, LoanRecord } from "../utils/loanUtils";
import { loanApi } from "../services/loanApi";
import { checkBackend } from "../services/apiClient";

export function Payment() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<LoanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loanId) return;
    const loans = loadLoans();
    const found = loans.find((l) => l.id === loanId);
    if (found) {
      setLoan(found);
      if (found.paymentStatus === "paid") {
        setPaid(true);
      }
    } else {
      setError("Peminjaman tidak ditemukan.");
    }
    setLoading(false);
  }, [loanId]);

  const handlePay = async () => {
    if (!loan) return;
    setPaying(true);
    setError("");

    const apiId = loanApi.extractNumericId(loan.id);
    const backendUp = await checkBackend();
    if (backendUp) {
      const ok = await loanApi.updateStatus(apiId, "pay");
      if (!ok) {
        setError("Gagal memproses pembayaran.");
        setPaying(false);
        return;
      }
    }

    const loans = loadLoans();
    const updated = loans.map((l) =>
      l.id === loan.id ? { ...l, paymentStatus: "paid" as const } : l
    );
    saveLoans(updated);
    setLoan((prev) => (prev ? { ...prev, paymentStatus: "paid" } : null));
    setPaid(true);
    setPaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <Loader size={32} className="text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-sky-900 mb-2">Peminjaman Tidak Ditemukan</h1>
          <p className="text-sky-500 text-sm mb-6">Data peminjaman tidak valid atau telah dihapus.</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>
    );
  }

  const paymentUrl = `${window.location.origin}/payment/${loan.id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg border border-sky-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0c3558] to-sky-700 p-6 text-center">
            <h1 className="text-white text-xl font-bold">Pembayaran Denda</h1>
            <p className="text-sky-300 text-sm mt-1">Perpustakaan Kota Nusantara</p>
          </div>

          {paid ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-sky-900 mb-2">Pembayaran Berhasil!</h2>
              <p className="text-sky-500 text-sm mb-2">
                Denda sebesar <span className="font-semibold text-sky-700">Rp {loan.fine.toLocaleString("id-ID")}</span> telah dibayar.
              </p>
              <p className="text-sky-400 text-xs mb-6">Buku: {loan.title}</p>
              <button
                onClick={() => navigate(loan.userId ? "/user/account" : "/")}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors"
              >
                Selesai
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-sky-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sky-500 text-sm">ID Peminjaman</span>
                  <span className="text-sky-900 text-sm font-semibold">{loan.id}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sky-500 text-sm">Buku</span>
                  <span className="text-sky-900 text-sm font-semibold text-right max-w-[200px] truncate">{loan.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sky-500 text-sm">Total Denda</span>
                  <span className="text-rose-600 text-lg font-bold">Rp {loan.fine.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-sm">
                  <QRCodeSVG value={paymentUrl} size={200} level="M" />
                </div>
              </div>

              <p className="text-center text-sky-400 text-xs mb-6">
                Scan QR code di atas menggunakan HP, atau klik tombol di bawah untuk membayar.
              </p>

              {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {paying ? (
                  <><Loader size={16} className="animate-spin" /> Memproses...</>
                ) : (
                  <><CheckCircle size={16} /> Bayar Sekarang (Simulasi)</>
                )}
              </button>

              <p className="text-center text-sky-400 text-[10px] mt-3">
                * Prototipe — pembayaran hanya simulasi, tidak ada transaksi riil.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
