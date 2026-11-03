# Migrasi Neon

`schema.sql` hanya menjalankan `CREATE TABLE IF NOT EXISTS`, sehingga tidak
mengubah tabel yang sudah ada. Setiap perubahan skema setelah database Neon
terisi harus ditulis sebagai file SQL di folder ini dan dijalankan manual.

Aturan penamaan: `YYYYMMDD-deskripsi.sql`, misalnya
`20261101-add-cover-credit.sql`.

Menjalankan ke Neon (butuh `psql` di `PATH`):

```powershell
psql "<NEON_DATABASE_URL>" -f database/postgres/migrations/20261101-add-cover-credit.sql
```

Terapkan migrasi ke Neon sebelum `npm run db:sync:neon -- --apply`, agar kolom
yang dipakai skrip sinkron sudah tersedia.
