import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface TransactionCodeProps {
  code: string;
  tone?: "light" | "dark";
  className?: string;
}

export function TransactionCode({ code, tone = "light", className = "" }: TransactionCodeProps) {
  const [copied, setCopied] = useState(false);

  if (!code) {
    return <span className="text-xs text-slate-400">-</span>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const input = document.createElement("textarea");
      input.value = code;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const toneClass =
    tone === "dark"
      ? "border-white/10 bg-white/5 text-sky-200 hover:bg-white/10"
      : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100";

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Klik untuk menyalin kode transaksi"
      aria-label={`Salin kode transaksi ${code}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors ${toneClass} ${className}`}
    >
      <span>{code}</span>
      {copied ? (
        <>
          <Check size={12} className="text-emerald-500" />
          <span className="font-sans text-[10px] text-emerald-600">Disalin</span>
        </>
      ) : (
        <Copy size={12} className="opacity-60" />
      )}
    </button>
  );
}
