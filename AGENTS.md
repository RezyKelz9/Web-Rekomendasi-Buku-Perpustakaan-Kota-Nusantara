# AGENTS.md

## Proyek

Aplikasi web perpustakaan digital "Halaman Web Rekomendasi Buku" (Perpustakaan Kota Nusantara).

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS 4, React Router — port `5173`
- **Backend:** Node.js + Express + `pg` — port `3001`, base URL `http://localhost:3001/api`
- **Database:** PostgreSQL `db_perpus_digital` (`127.0.0.1:5432`, user `postgres`)
- **Akun demo:** `admin@perpus.local` / `admin123`, `member@perpus.local` / `member123`

## Konteks wajib

Sebelum mengerjakan tugas lanjutan tentang perpus, baca `Web perpus_digital.md`
(riwayat sesi 20 Okt 2026: migrasi dari localStorage ke PostgreSQL; compaction
summary ada di bagian bawah file).

## Perintah

```bash
npm run db:setup       # buat/migrasi database + seed
npm run db:sync:neon   # sinkron konten lokal -> Neon (dry-run; --apply untuk menulis)
npm run api            # backend Express (port 3001)
npm run dev            # frontend Vite (port 5173)
npm run build          # build produksi
```

`.env` disalin dari `.env.example` (`VITE_API_URL`, `API_PORT`, `FRONTEND_ORIGIN`,
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `NEON_DATABASE_URL`).
Restart API setelah ubah `.env`.

## Aturan proyek

- Tanpa fallback localStorage — semua data lewat API.
- Path API diakhiri `/index.php` (mis. `books/index.php`).
- Frontend memanggil path API **tanpa ekstensi** (mis. `books`, `login`) karena
  Vercel memblokir `.php`. `server/app.js` memetakan alias ke route `.php` lama.
  Hosting: `api/[route].js` di Vercel + Neon (`DATABASE_URL`).
- Kategori/rak: frontend pakai `kode` sebagai `id`, field `dbId` (numerik) untuk
  update/delete di backend.
- Buku: `id` numerik (string). Sesi/token disimpan di `sessionStorage`
  (`perpus_session`), server mengembalikan `auth_token`.
- Denda/durasi pinjam dihitung di server dari `library_settings` + `loan_rules`.
- Sinkron konten lokal -> Neon hanya lewat `npm run db:sync:neon` (dry-run
  default, `--apply` untuk menulis). Tabel `users`, `loans`, `ratings`,
  `activity_logs`, `library_settings` tidak ikut disinkronkan. Perubahan skema
  untuk Neon ditulis di `database/postgres/migrations/`.
- Kode transaksi peminjaman (`transaction_code`, format `PJM-YYYYMMDD-XXXX`)
  dibuat server lewat `generateLoanCode()` dan tidak boleh diubah setelah ada.
  Semua insert ke `loans` wajib mengisi kolom ini. Migrasi skema ke Neon
  dijalankan sebelum deploy kode yang memakai kolom baru.
