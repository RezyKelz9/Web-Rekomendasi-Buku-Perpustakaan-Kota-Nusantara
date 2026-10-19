# Halaman Web Rekomendasi Buku - Perpustakaan Kota Nusantara

Aplikasi web perpustakaan digital untuk rekomendasi buku, pencarian koleksi, informasi rak,
kategori, serta peminjaman buku. Terdapat dua portal: **anggota** dan **admin**.

## Teknologi

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS 4, React Router
- **Backend:** PHP (Laragon), MySQL/MariaDB
- **Data fallback:** localStorage (aplikasi tetap bisa dipakai tanpa backend)

## Kebutuhan

- Node.js 20+ dan npm
- Laragon (Apache + MySQL) untuk menjalankan API PHP
- Git

## Menjalankan Frontend

```bash
git clone <url-repo-anda>
cd Web-Rekomendasi-Buku-di-Perpustakaan-Kota-Nusantara
npm install
```

Salin konfigurasi environment:

```bash
copy .env.example .env
```

Isi `.env`:

```env
VITE_API_URL=http://localhost/perpustakaan-api/api
```

Jalankan development server:

```bash
npm run dev
```

Buka `http://localhost:5173`.

Build produksi:

```bash
npm run build
npm run preview
```

## Menjalankan Backend (Laragon)

1. Salin folder `laragon-api` ke `C:\laragon\www\perpustakaan-api`.
2. Salin `laragon-api/.env.example` menjadi `laragon-api/.env`, lalu sesuaikan kredensial MySQL:
   ```env
   DB_HOST=127.0.0.1
   DB_NAME=perpustakaan_nusantara
   DB_USER=root
   DB_PASS=
   ```
3. Jalankan **Apache** dan **MySQL** dari Laragon.
4. Impor `laragon-api/database/schema.sql` melalui HeidiSQL atau phpMyAdmin.
5. Pastikan URL API di `.env` frontend sesuai, misalnya
   `VITE_API_URL=http://localhost/perpustakaan-api/api`.
6. Restart `npm run dev` setelah mengubah `.env`.

Endpoint API tersedia di `laragon-api/api/` (`auth`, `books`, `categories`, `shelves`,
`loans`, `ratings`, `users`).

## Akun Demo (mode tanpa backend)

Jika backend tidak aktif, aplikasi memakai data lokal:

| Peran  | Email                | Password  |
|--------|----------------------|-----------|
| Admin  | admin@perpus.local   | admin123  |
| Member | member@perpus.local  | member123 |

Saat backend aktif, daftarkan admin pertama melalui halaman `/register-admin`.

## Struktur Project

```text
.
├── src/
│   ├── app/
│   │   ├── components/    # Komponen UI dan layout
│   │   ├── context/       # Auth context
│   │   ├── data/          # Data buku/category/shelf fallback
│   │   ├── pages/         # Halaman user & admin
│   │   ├── services/      # Client API dan service data
│   │   └── utils/         # Helper
│   └── styles/
├── laragon-api/           # Backend PHP + schema database
├── .env.example
└── package.json
```

## Catatan

- File `.env` tidak ikut di-commit. Gunakan `.env.example` sebagai template.
- Folder `node_modules`, `dist`, dan `graphify-out` diabaikan oleh Git.
- CORS backend mengizinkan `http://localhost:5173`. Jika port Vite berubah, sesuaikan
  `laragon-api/config/bootstrap.php`.
