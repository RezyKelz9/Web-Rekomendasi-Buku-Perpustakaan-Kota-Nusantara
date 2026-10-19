# API Laragon — Perpustakaan Kota Nusantara

1. Salin folder `laragon-api` ini ke `C:\laragon\www\perpustakaan-api`.
2. Salin `.env.example` menjadi `.env`; sesuaikan jika kredensial MySQL Laragon berbeda.
3. Jalankan Apache dan MySQL dari Laragon.
4. Impor `database/schema.sql` lewat HeidiSQL/phpMyAdmin.
5. Salin `.env.example` di root frontend menjadi `.env`, dengan nilai `VITE_API_URL=http://localhost/perpustakaan-api/api`.

Endpoint: `auth/login.php`, `auth/register.php`, `auth/register-admin.php`, `books/index.php`, `categories/index.php`, `shelves/index.php`, `loans/index.php`. Helper frontend tersedia di `src/app/services/api.ts`.

Catatan: `schema.sql` menyediakan struktur seluruh data aplikasi dan seed kategori/aturan pinjaman. Buku lama di `src/app/data/libraryData.ts` dapat dimasukkan melalui endpoint `POST books/index.php` atau impor seed lanjutan.
