import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { withTransaction } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, respond } from "../http.js";
import { generateLoanCode, generateMemberCode, normalizeIsbn, normalizeText } from "../helpers.js";

export const migrationRouter = Router();

const ROLES = new Set(["member", "admin", "staff", "petugasRak"]);
const STATUSES = new Set(["active", "pending", "inactive", "blocked"]);
const LOAN_STATUSES = new Set(["Menunggu", "Dipinjam", "Dikembalikan", "Selesai", "Ditolak"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function dateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function ensureCategory(client, code) {
  const value = normalizeText(code);
  if (!value) return null;
  const existing = await client.query("SELECT id FROM categories WHERE kode = $1", [value]);
  if (existing.rowCount > 0) return existing.rows[0].id;
  const inserted = await client.query(
    `INSERT INTO categories (kode, name, color, icon, description)
     VALUES ($1, $2, 'bg-sky-100 text-sky-700', 'BookOpen', 'Kategori hasil migrasi data lokal')
     ON CONFLICT (kode) DO NOTHING
     RETURNING id`,
    [value, value.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())]
  );
  if (inserted.rowCount > 0) return inserted.rows[0].id;
  const again = await client.query("SELECT id FROM categories WHERE kode = $1", [value]);
  return again.rows[0]?.id ?? null;
}

async function ensureShelf(client, code) {
  const value = normalizeText(code);
  if (!value) return null;
  const existing = await client.query("SELECT id FROM shelves WHERE kode = $1", [value]);
  if (existing.rowCount > 0) return existing.rows[0].id;
  const normalized = value.toUpperCase().replace(/\s+/g, "-").slice(0, 20);
  const inserted = await client.query(
    `INSERT INTO shelves (kode, name, location, floor, capacity)
     VALUES ($1, $2, 'Lokasi hasil migrasi', 1, 0)
     ON CONFLICT (kode) DO NOTHING
     RETURNING id`,
    [normalized, `Rak ${normalized}`]
  );
  if (inserted.rowCount > 0) return inserted.rows[0].id;
  const again = await client.query("SELECT id FROM shelves WHERE kode = $1", [normalized]);
  return again.rows[0]?.id ?? null;
}

async function uniqueMemberCode(client, desired, jenisAnggota, role) {
  if (desired) {
    const exists = await client.query("SELECT id FROM users WHERE member_code = $1", [desired]);
    if (exists.rowCount === 0) return desired;
  }
  return generateMemberCode(client, jenisAnggota, role);
}

export const migrationSummary = {
  users: { imported: 0, skipped: 0, pendingPassword: 0 },
  books: { imported: 0, skipped: 0 },
  loans: { imported: 0, skipped: 0, failed: 0 },
  ratings: { imported: 0, skipped: 0 },
  activities: { imported: 0, skipped: 0 },
  settings: false,
  warnings: [],
};

migrationRouter.post(
  "/migration/local-data.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const payload = input(req);
    const summary = {
      users: { imported: 0, skipped: 0, pendingPassword: 0 },
      books: { imported: 0, skipped: 0 },
      loans: { imported: 0, skipped: 0, failed: 0 },
      ratings: { imported: 0, skipped: 0 },
      activities: { imported: 0, skipped: 0 },
      settings: false,
      warnings: [],
    };

    try {
      await withTransaction(async (client) => {
        const userMap = new Map();

        for (const legacy of asArray(payload.users)) {
          const email = String(legacy.email || "").trim().toLowerCase();
          if (!email) {
            summary.users.skipped += 1;
            continue;
          }
          const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
          if (existing.rowCount > 0) {
            userMap.set(String(legacy.id), existing.rows[0].id);
            userMap.set(email, existing.rows[0].id);
            summary.users.skipped += 1;
            continue;
          }

          const role = ROLES.has(legacy.role) ? legacy.role : "member";
          const status = STATUSES.has(legacy.status) ? legacy.status : "active";
          const jenisAnggota = normalizeText(legacy.jenis_anggota) || "Umum";
          const providedPassword = normalizeText(legacy.password);
          const finalStatus = providedPassword ? status : "pending";
          const password = providedPassword || randomBytes(16).toString("base64url");
          const passwordHash = await bcrypt.hash(password, 10);
          const memberCode = await uniqueMemberCode(client, legacy.member_code, jenisAnggota, role);

          const inserted = await client.query(
            `INSERT INTO users
               (nama_lengkap, email, username, nip, password_hash, nomor_hp, alamat,
                jenis_anggota, membership_type, role, status, member_code, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING id`,
            [
              normalizeText(legacy.nama_lengkap) || email.split("@")[0],
              email,
              normalizeText(legacy.username),
              normalizeText(legacy.nip),
              passwordHash,
              normalizeText(legacy.nomor_hp),
              normalizeText(legacy.alamat),
              jenisAnggota,
              normalizeText(legacy.membership_type),
              role,
              finalStatus,
              memberCode,
              toDate(legacy.created_at),
            ]
          );
          userMap.set(String(legacy.id), inserted.rows[0].id);
          userMap.set(email, inserted.rows[0].id);
          summary.users.imported += 1;
          if (!providedPassword) summary.users.pendingPassword += 1;
        }

        const bookMap = new Map();
        for (const legacy of asArray(payload.books)) {
          if (!legacy?.title || !legacy?.author) {
            summary.books.skipped += 1;
            continue;
          }
          const categoryId = await ensureCategory(client, legacy.categoryId);
          const shelfId = await ensureShelf(client, legacy.shelfId);
          const isbn = normalizeIsbn(legacy.isbn);
          const values = [
            String(legacy.title).trim(),
            String(legacy.author).trim(),
            categoryId,
            shelfId,
            normalizeText(legacy.shelfPosition),
            normalizeText(legacy.cover),
            Math.min(5, Math.max(0, Number(legacy.rating || 0))),
            Number(legacy.year || 0) || null,
            Number(legacy.pages || 0) || null,
            isbn,
            Math.max(0, Number(legacy.stock || 0)),
            normalizeText(legacy.description),
            normalizeText(legacy.publisher),
            Boolean(legacy.recommended),
          ];

          const numericId = Number(legacy.id);
          let saved;
          if (Number.isInteger(numericId) && numericId > 0) {
            saved = await client.query(
              `INSERT INTO books
                 (id, title, author, category_id, shelf_id, shelf_position, cover, rating,
                  published_year, pages, isbn, stock, description, publisher, recommended)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
               ON CONFLICT (id) DO UPDATE SET
                 title = EXCLUDED.title, author = EXCLUDED.author,
                 category_id = EXCLUDED.category_id, shelf_id = EXCLUDED.shelf_id,
                 shelf_position = EXCLUDED.shelf_position, cover = EXCLUDED.cover,
                 rating = EXCLUDED.rating, published_year = EXCLUDED.published_year,
                 pages = EXCLUDED.pages, isbn = EXCLUDED.isbn, stock = EXCLUDED.stock,
                 description = EXCLUDED.description, publisher = EXCLUDED.publisher,
                 recommended = EXCLUDED.recommended
               RETURNING id`,
              [numericId, ...values]
            );
          } else {
            saved = await client.query(
              `INSERT INTO books
                 (title, author, category_id, shelf_id, shelf_position, cover, rating,
                  published_year, pages, isbn, stock, description, publisher, recommended)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
               RETURNING id`,
              values
            );
          }
          bookMap.set(String(legacy.id), saved.rows[0].id);
          summary.books.imported += 1;
        }

        const loanMap = new Map();
        for (const legacy of asArray(payload.loans)) {
          const userId = userMap.get(String(legacy.userId));
          const bookId = bookMap.get(String(legacy.bookId));
          if (!userId || !bookId) {
            summary.loans.failed += 1;
            summary.warnings.push(`Pinjaman ${legacy.id || ""} dilewati: user/buku tidak ditemukan.`);
            continue;
          }
          const borrowedAt = toDate(legacy.borrowDate);
          const duplicate = await client.query(
            `SELECT id FROM loans WHERE user_id = $1 AND book_id = $2 AND borrowed_at = $3`,
            [userId, bookId, borrowedAt]
          );
          if (duplicate.rowCount > 0) {
            loanMap.set(String(legacy.id), duplicate.rows[0].id);
            summary.loans.skipped += 1;
            continue;
          }

          const status = LOAN_STATUSES.has(legacy.status) ? legacy.status : "Menunggu";
          const dueAt = toDate(legacy.dueDate, borrowedAt);
          const returnedAt = dateOrNull(legacy.returnDate);
          const paymentStatus = legacy.paymentStatus === "paid" ? "paid" : "unpaid";
          const inserted = await client.query(
            `INSERT INTO loans
               (user_id, book_id, borrowed_at, due_at, returned_at, duration, fine,
                is_favorite, payment_status, status, transaction_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id`,
            [
              userId,
              bookId,
              borrowedAt,
              dueAt,
              returnedAt,
              Math.max(0, Number(legacy.duration || 7)),
              Math.max(0, Number(legacy.fine || 0)),
              Boolean(legacy.isFavorite),
              paymentStatus,
              status,
              generateLoanCode(borrowedAt),
            ]
          );
          loanMap.set(String(legacy.id), inserted.rows[0].id);
          summary.loans.imported += 1;
        }

        for (const legacy of asArray(payload.ratings)) {
          const userId = userMap.get(String(legacy.userId));
          const loanId = loanMap.get(String(legacy.loanId));
          const rating = Number(legacy.rating);
          if (!userId || !loanId || rating < 1 || rating > 5) {
            summary.ratings.skipped += 1;
            continue;
          }
          await client.query(
            `INSERT INTO ratings (loan_id, user_id, rating, created_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (loan_id) DO UPDATE SET
               rating = EXCLUDED.rating, user_id = EXCLUDED.user_id, created_at = EXCLUDED.created_at`,
            [loanId, userId, rating, toDate(legacy.timestamp ? new Date(legacy.timestamp) : null)]
          );
          summary.ratings.imported += 1;
        }

        if (payload.settings && typeof payload.settings === "object") {
          const map = [
            ["durasiUmum", "durasi_umum"],
            ["durasiPelajar", "durasi_pelajar"],
            ["durasiDosen", "durasi_dosen"],
            ["dendaUmum", "denda_umum"],
            ["dendaPelajar", "denda_pelajar"],
            ["dendaDosen", "denda_dosen"],
            ["dendaBukuFavorit", "denda_buku_favorit"],
            ["batasBukuUmum", "batas_buku_umum"],
            ["batasBukuPelajar", "batas_buku_pelajar"],
            ["batasBukuDosen", "batas_buku_dosen"],
          ];
          const assignments = [];
          const params = [];
          for (const [camel, column] of map) {
            if (payload.settings[camel] === undefined) continue;
            params.push(Math.max(0, Number(payload.settings[camel]) || 0));
            assignments.push(`${column} = $${params.length}`);
          }
          if (assignments.length > 0) {
            await client.query(
              `UPDATE library_settings SET ${assignments.join(", ")} WHERE id = 1`,
              params
            );
            summary.settings = true;
          }
        }

        for (const legacy of asArray(payload.activities)) {
          if (!legacy?.description || !legacy?.module || !legacy?.action) {
            summary.activities.skipped += 1;
            continue;
          }
          const timestamp = toDate(legacy.timestamp);
          const adminEmail = normalizeText(legacy.adminEmail) || req.user.email;
          const duplicate = await client.query(
            `SELECT id FROM activity_logs
             WHERE created_at = $1 AND admin_email = $2 AND description = $3`,
            [timestamp, adminEmail, String(legacy.description)]
          );
          if (duplicate.rowCount > 0) {
            summary.activities.skipped += 1;
            continue;
          }
          await client.query(
            `INSERT INTO activity_logs
               (admin_id, admin_name, admin_email, module, action, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              req.user.id,
              normalizeText(legacy.adminName) || req.user.nama_lengkap,
              adminEmail,
              String(legacy.module),
              String(legacy.action),
              String(legacy.description),
              timestamp,
            ]
          );
          summary.activities.imported += 1;
        }

        await client.query(
          `SELECT setval(
             pg_get_serial_sequence('books', 'id'),
             GREATEST((SELECT COALESCE(MAX(id), 0) FROM books), 1),
             true
           )`
        );
      });

      respond(res, { success: true, message: "Migrasi data lokal selesai.", data: summary });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  })
);
