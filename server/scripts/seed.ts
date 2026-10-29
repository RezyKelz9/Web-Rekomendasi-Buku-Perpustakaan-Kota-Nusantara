import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import {
  categories as seedCategories,
  shelves as seedShelves,
  books as seedBooks,
  loanRules as seedLoanRules,
} from "../../src/app/data/libraryData.ts";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "db_perpus_digital",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const categoryIds = new Map<string, number>();
    for (const category of seedCategories) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO categories (kode, name, color, icon, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (kode) DO UPDATE SET
           name = EXCLUDED.name,
           color = EXCLUDED.color,
           icon = EXCLUDED.icon,
           description = EXCLUDED.description
         RETURNING id`,
        [category.id, category.name, category.color, category.icon, category.description]
      );
      categoryIds.set(category.id, result.rows[0].id);
    }

    const shelfIds = new Map<string, number>();
    for (const shelf of seedShelves) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO shelves (kode, name, location, floor, capacity)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (kode) DO UPDATE SET
           name = EXCLUDED.name,
           location = EXCLUDED.location,
           floor = EXCLUDED.floor,
           capacity = EXCLUDED.capacity
         RETURNING id`,
        [shelf.id, shelf.name, shelf.location, shelf.floor, shelf.capacity]
      );
      shelfIds.set(shelf.id, result.rows[0].id);

      for (const categoryCode of shelf.categories) {
        const categoryId = categoryIds.get(categoryCode);
        if (categoryId) {
          await client.query(
            `INSERT INTO shelf_categories (shelf_id, category_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [result.rows[0].id, categoryId]
          );
        }
      }
    }

    for (const book of seedBooks) {
      await client.query(
        `INSERT INTO books
           (id, title, author, category_id, shelf_id, shelf_position, cover, rating,
            published_year, pages, isbn, stock, description, publisher, recommended)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           author = EXCLUDED.author,
           category_id = EXCLUDED.category_id,
           shelf_id = EXCLUDED.shelf_id,
           shelf_position = EXCLUDED.shelf_position,
           cover = EXCLUDED.cover,
           rating = EXCLUDED.rating,
           published_year = EXCLUDED.published_year,
           pages = EXCLUDED.pages,
           isbn = EXCLUDED.isbn,
           stock = EXCLUDED.stock,
           description = EXCLUDED.description,
           publisher = EXCLUDED.publisher,
           recommended = EXCLUDED.recommended`,
        [
          Number(book.id),
          book.title,
          book.author,
          categoryIds.get(book.categoryId) ?? null,
          shelfIds.get(book.shelfId) ?? null,
          book.shelfPosition || null,
          book.cover || null,
          book.rating,
          book.year || null,
          book.pages || null,
          book.isbn || null,
          book.stock,
          book.description || null,
          book.publisher || null,
          Boolean(book.recommended),
        ]
      );
    }

    await client.query(
      `SELECT setval(
         pg_get_serial_sequence('books', 'id'),
         GREATEST((SELECT COALESCE(MAX(id), 0) FROM books), 1),
         true
       )`
    );

    for (const rule of seedLoanRules) {
      await client.query(
        `INSERT INTO loan_rules (type, duration_days, max_renewals, fine_per_day, description, eligibility)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (type) DO UPDATE SET
           duration_days = EXCLUDED.duration_days,
           max_renewals = EXCLUDED.max_renewals,
           fine_per_day = EXCLUDED.fine_per_day,
           description = EXCLUDED.description,
           eligibility = EXCLUDED.eligibility`,
        [
          rule.type,
          rule.duration,
          rule.maxRenewals,
          rule.fine,
          rule.description,
          rule.eligibility,
        ]
      );
    }

    await client.query(
      `INSERT INTO library_settings (
         id, durasi_umum, durasi_pelajar, durasi_dosen, denda_umum, denda_pelajar,
         denda_dosen, denda_buku_favorit, batas_buku_umum, batas_buku_pelajar, batas_buku_dosen
       ) VALUES (1, 7, 14, 90, 4000, 1000, 0, 2000, 2, 3, 5)
       ON CONFLICT (id) DO NOTHING`
    );

    const demoUsers = [
      {
        nama: "Admin Perpustakaan",
        email: "admin@perpus.local",
        username: "admin",
        nip: "ADM-0001",
        password: "admin123",
        role: "admin",
        memberCode: "ADM-0001",
        jenis: "SuperAdmin",
      },
      {
        nama: "Anggota Contoh",
        email: "member@perpus.local",
        username: null,
        nip: null,
        password: "member123",
        role: "member",
        memberCode: "UMM-0001",
        jenis: "Umum",
      },
    ];

    for (const user of demoUsers) {
      const hash = await bcrypt.hash(user.password, 10);
      await client.query(
        `INSERT INTO users
           (nama_lengkap, email, username, nip, password_hash, alamat, jenis_anggota,
            membership_type, role, status, member_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
         ON CONFLICT (email) DO NOTHING`,
        [
          user.nama,
          user.email,
          user.username,
          user.nip,
          hash,
          "Kantor Perpustakaan Kota Nusantara",
          user.jenis,
          user.role === "member" ? "Umum" : null,
          user.role,
          user.memberCode,
        ]
      );
    }

    await client.query("COMMIT");

    const summary = await client.query<{
      books: string;
      categories: string;
      shelves: string;
      loan_rules: string;
      users: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM books) AS books,
         (SELECT COUNT(*) FROM categories) AS categories,
         (SELECT COUNT(*) FROM shelves) AS shelves,
         (SELECT COUNT(*) FROM loan_rules) AS loan_rules,
         (SELECT COUNT(*) FROM users) AS users`
    );

    const row = summary.rows[0];
    console.log("Seed selesai:");
    console.log(`  Buku       : ${row.books}`);
    console.log(`  Kategori   : ${row.categories}`);
    console.log(`  Rak        : ${row.shelves}`);
    console.log(`  Aturan     : ${row.loan_rules}`);
    console.log(`  Pengguna   : ${row.users}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seed gagal:", error);
  process.exit(1);
});
