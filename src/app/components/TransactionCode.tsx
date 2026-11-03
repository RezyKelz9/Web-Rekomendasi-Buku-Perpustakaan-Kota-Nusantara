import { useState } from "react";

interface TransactionCodeProps {
  code: string;
  className?: string;
}

export function TransactionCode({ code, className = "" }: TransactionCodeProps) {
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

  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        title="Klik untuk menyalin kode transaksi"
        aria-label={`Salin kode transaksi ${code}`}
        className="cursor-pointer text-inherit hover:underline"
      >
        {code}
      </button>
      {copied && <span className="text-[10px] text-emerald-600">Disalin</span>}
    </span>
  );
}
