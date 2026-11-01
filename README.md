# Halaman Web Rekomendasi Buku - Perpustakaan Kota Nusantara

Aplikasi web perpustakaan digital untuk rekomendasi buku, pencarian koleksi, informasi rak,
kategori, serta peminjaman buku. Terdapat dua portal: **anggota** dan **admin**.

## Teknologi

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS 4, React Router
- **Backend:** Node.js, Express, `pg`
- **Database:** PostgreSQL 17 (`db_perpus_digital`)
- **Sesi login:** token disimpan di `sessionStorage`

Seluruh data aplikasi disimpan di PostgreSQL. Tidak ada fallback data statis atau localStorage
saat API tidak tersedia. Halaman **Admin > Migrasi Data Lama** disediakan untuk memindahkan data
dari localStorage lama satu kali.

## Kebutuhan

- Node.js 22.18+ dan npm (disarankan Node.js 24, karena seed memakai TypeScript native)
- PostgreSQL 17 yang berjalan di `127.0.0.1:5432`
- Git

## Menjalankan Aplikasi

```bash
npm install
copy .env.example .env
npm run db:setup
```

`npm run db:setup` membuat database jika belum ada, menerapkan
`database/postgres/schema.sql`, lalu menjalankan seed 51 buku, kategori, rak, aturan pinjam,
pengaturan, dan akun demo.

Alternatif: pulihkan data lengkap dari dump yang ada di repo.

```bash
npm run db:restore
```

Jalankan API dan frontend di dua terminal:

```bash
npm run api
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001/api`
- Health check: `http://localhost:3001/api/health`

Untuk pengembangan API dengan auto-reload:

```bash
npm run api:dev
```

Pemeriksaan tipe dan build produksi:

```bash
npm run typecheck
npm run build
npm run preview
```

## Konfigurasi `.env`

```env
VITE_API_URL=http://localhost:3001/api
API_PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=db_perpus_digital
DB_USER=postgres
DB_PASSWORD=
```

Sesuaikan `DB_USER` dan `DB_PASSWORD` dengan instalasi PostgreSQL Anda. Restart API setelah
mengubah `.env`.

## Akun Demo

| Peran  | Email                | Password  |
|--------|----------------------|-----------|
| Admin  | admin@perpus.local   | admin123  |
| Member | member@perpus.local  | member123 |

Akun tambahan dapat dibuat melalui `/register` (anggota) dan `/register-admin` (admin).

## Pindah ke Laptop Lain

Semua kode dan dump database diambil dari GitHub, jadi tidak perlu menyalin folder project.

1. Install **Node.js 22.18+** (disarankan Node.js 24) dan **PostgreSQL 17**.
   Saat instalasi PostgreSQL, catat password user `postgres` dan pastikan port `5432`.
2. Clone repository:

   ```bash
   git clone https://github.com/RezyKelz9/Web-Rekomendasi-Buku-Perpustakaan-Kota-Nusantara.git
   cd Web-Rekomendasi-Buku-Perpustakaan-Kota-Nusantara
   ```

3. Siapkan konfigurasi dan dependensi:

   ```bash
   copy .env.example .env
   npm install
   ```

   Isi `DB_PASSWORD` di `.env` sesuai password PostgreSQL Anda.

4. Pilih salah satu cara menyiapkan database:

   ```bash
   npm run db:restore   # data lengkap (akun, buku, pinjaman, log) dari database/backup
   ```

   atau database baru dengan data seed:

   ```bash
   npm run db:setup
   ```

   `db:restore` membutuhkan `pg_restore` di `PATH`. Jika belum ada, jalankan
   `setx PATH "%PATH%;C:\Program Files\PostgreSQL\17\bin"` lalu buka terminal baru.

5. Jalankan API dan frontend di dua terminal:

   ```bash
   npm run api
   npm run dev
   ```

   Buka `http://localhost:5173`, login dengan akun demo di atas.

## Endpoint Utama

Semua endpoint memakai prefix `/api`. Klien memanggil path tanpa ekstensi (mis.
`books`, `login`) karena Vercel memblokir path berakhiran `.php`; backend tetap
menyediakan route `.php` lama dan `server/app.js` memetakan alias-nya.

- `login`, `register`, `register-admin` (legacy: `auth/login.php`, `auth/register.php`, ...)
- `me`, `logout`, `change-password`
- `books`, `categories`, `shelves`
- `loans`, `ratings`, `users`
- `settings`, `loan-rules`
- `stats`, `activity`
- `migration-local-data` (legacy: `migration/local-data.php`)

Endpoint yang mengubah data memerlukan header `Authorization: Bearer <auth_token>`.
Endpoint admin memerlukan role `admin`.

## Deploy Gratis (Vercel + Neon)

Produksi: https://perpus-digital-topaz-mu.vercel.app

Arsitektur: Vercel (frontend static + fungsi `api/[route].js`) dan Neon PostgreSQL
(region Singapore). Setiap `git push` ke `main` otomatis deploy (integrasi GitHub).

Langkah menyiapkan dari nol:

1. Buat project Neon, salin connection string (`...?sslmode=require`).
2. Restore dump ke Neon dari laptop (butuh `pg_restore`):

   ```bash
   pg_restore --no-owner --no-privileges --clean --if-exists \
     -d "<neon-connection-string>" database/backup/db_perpus_digital.dump
   ```

3. Import repo di Vercel (Framework Preset: Vite), lalu set Environment Variables:
   - `DATABASE_URL=<neon-connection-string>`
   - `VITE_API_URL=/api` (wajib, dibaca saat build)
   - `FRONTEND_ORIGIN=https://<project>.vercel.app`
4. Deploy. Cek `https://<project>.vercel.app/api/health`.

Catatan: fungsi Vercel hanya menangkap satu segmen path, jadi route API
dipadatkan (`/api/login`, `/api/migration-local-data`). `vercel.json` mengatur
SPA fallback dengan pengecualian `/api/`.

## Migrasi Data localStorage

1. Jalankan API dan frontend.
2. Login sebagai admin.
3. Buka **Admin > Migrasi Data Lama**.
4. Periksa jumlah data yang terdeteksi, klik **Mulai Migrasi**.
5. Setelah berhasil, klik **Hapus Data localStorage Lama**.

Data yang sudah ada di PostgreSQL tidak ditimpa; data duplikat akan dilewati.

## Struktur Project

```text
.
├── database/
│   ├── postgres/schema.sql        # Schema PostgreSQL
│   └── backup/                    # Dump database (pg_dump -Fc)
├── server/
│   ├── index.js                   # Entry API Express
│   ├── db.js, http.js, helpers.js, auth.js
│   ├── routes/                    # Endpoint API
│   └── scripts/                   # setup-db.js, restore-db.js, seed.ts
├── src/app/
│   ├── components/                # Komponen UI dan layout
│   ├── context/                   # Auth context (sessionStorage)
│   ├── data/                      # Tipe data dan sumber seed
│   ├── pages/                     # Halaman user & admin
│   ├── services/                  # Client API
│   └── utils/                     # Helper perhitungan denda dan tanggal
├── .env.example
└── package.json
```

## Catatan

- File `.env` tidak ikut di-commit. Gunakan `.env.example` sebagai template.
- Folder `node_modules`, `dist`, dan `graphify-out` diabaikan oleh Git.
- CORS API mengizinkan `http://localhost:5173`. Ubah `FRONTEND_ORIGIN` jika port Vite berubah.
- Stok buku adalah total salinan. Ketersediaan dihitung dari pinjaman berstatus `Menunggu`
  atau `Dipinjam`, sehingga stok tidak berubah saat approve/return.
