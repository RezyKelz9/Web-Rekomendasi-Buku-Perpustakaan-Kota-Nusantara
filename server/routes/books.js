import { Router } from "express";
import { pool, withTransaction } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, parseId, respond } from "../http.js";
import { logActivity, normalizeIsbn, normalizeText } from "../helpers.js";

export const booksRouter = Router();

const BOOK_SELECT = `
  SELECT b.id, b.title, b.author, c.kode AS category_id, s.kode AS shelf_id,
         b.shelf_position, b.cover, b.rating, b.published_year, b.pages, b.isbn,
         b.stock, b.description, b.publisher, b.recommended, b.created_at,
         GREATEST(
           b.stock - COALESCE((
             SELECT COUNT(*) FROM loans l
             WHERE l.book_id = b.id AND l.status IN ('Dipinjam', 'Menunggu')
           ), 0),
           0
         )::int AS available_stock
  FROM books b
  LEFT JOIN categories c ON c.id = b.category_id
  LEFT JOIN shelves s ON s.id = b.shelf_id
`;

async function resolveCategoryId(client, code) {
  const value = normalizeText(code);
  if (!value) return null;
  const result = await client.query("SELECT id FROM categories WHERE kode = $1", [value]);
  if (result.rowCount === 0) throw Object.assign(new Error("Kategori tidak ditemukan."), { status: 422 });
  return result.rows[0].id;
}

async function resolveShelfId(client, code) {
  const value = normalizeText(code);
  if (!value) return null;
  const result = await client.query("SELECT id FROM shelves WHERE kode = $1", [value]);
  if (result.rowCount === 0) throw Object.assign(new Error("Rak tidak ditemukan."), { status: 422 });
  return result.rows[0].id;
}

async function assertIsbnAvailable(client, isbn, excludeId = null) {
  if (!isbn) return;
  const params = [isbn];
  let sql = "SELECT id FROM books WHERE isbn = $1";
  if (excludeId) {
    params.push(excludeId);
    sql += " AND id <> $2";
  }
  const result = await client.query(sql, params);
  if (result.rowCount > 0) throw Object.assign(new Error("ISBN sudah digunakan."), { status: 409, code: "ISBN_EXISTS" });
}

async function fetchBook(client, id) {
  const result = await client.query(`${BOOK_SELECT} WHERE b.id = $1`, [id]);
  return result.rows[0] || null;
}

booksRouter.get(
  "/books/index.php",
  asyncHandler(async (req, res) => {
    const id = parseId(req.query.id);
    const params = [];
    let sql = BOOK_SELECT;
    if (id) {
      params.push(id);
      sql += " WHERE b.id = $1";
    }
    sql += " ORDER BY b.id DESC";
    const result = await pool.query(sql, params);
    respond(res, { success: true, data: result.rows });
  })
);

booksRouter.post(
  "/books/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    if (!String(data.title || "").trim() || !String(data.author || "").trim()) {
      return fail(res, "Judul dan penulis wajib diisi.", 422);
    }

    try {
      const book = await withTransaction(async (client) => {
        const categoryId = await resolveCategoryId(client, data.categoryId);
        const shelfId = await resolveShelfId(client, data.shelfId);
        const isbn = normalizeIsbn(data.isbn);
        await assertIsbnAvailable(client, isbn);

        const inserted = await client.query(
          `INSERT INTO books
             (title, author, category_id, shelf_id, shelf_position, cover, rating,
              published_year, pages, isbn, stock, description, publisher, recommended)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING id`,
          [
            String(data.title).trim(),
            String(data.author).trim(),
            categoryId,
            shelfId,
            normalizeText(data.shelfPosition),
            normalizeText(data.cover),
            Number(data.rating || 0),
            Number(data.year || data.publishedYear || 0) || null,
            Number(data.pages || 0) || null,
            isbn,
            Number(data.stock || 0),
            normalizeText(data.description),
            normalizeText(data.publisher),
            Boolean(data.recommended),
          ]
        );
        const created = await fetchBook(client, inserted.rows[0].id);
        await logActivity(client, req.user, "Buku", "Tambah", `Menambahkan buku baru "${created.title}" oleh ${created.author}`);
        return created;
      });
      respond(res, { success: true, data: book, message: "Buku berhasil ditambahkan." }, 201);
    } catch (error) {
      if (error.code === "ISBN_EXISTS" || error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

booksRouter.put(
  "/books/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id);
    if (!id) return fail(res, "ID buku tidak valid.", 422);

    try {
      const book = await withTransaction(async (client) => {
        const existing = await client.query("SELECT * FROM books WHERE id = $1", [id]);
        if (existing.rowCount === 0) throw Object.assign(new Error("Buku tidak ditemukan."), { status: 404 });

        const categoryId = await resolveCategoryId(client, data.categoryId);
        const shelfId = await resolveShelfId(client, data.shelfId);
        const isbn = normalizeIsbn(data.isbn);
        await assertIsbnAvailable(client, isbn, id);

        await client.query(
          `UPDATE books SET
             title = $1, author = $2, category_id = $3, shelf_id = $4,
             shelf_position = $5, cover = $6, rating = $7, published_year = $8,
             pages = $9, isbn = $10, stock = $11, description = $12,
             publisher = $13, recommended = $14
           WHERE id = $15`,
          [
            String(data.title || existing.rows[0].title).trim(),
            String(data.author || existing.rows[0].author).trim(),
            categoryId,
            shelfId,
            normalizeText(data.shelfPosition),
            normalizeText(data.cover),
            Number(data.rating || 0),
            Number(data.year || data.publishedYear || 0) || null,
            Number(data.pages || 0) || null,
            isbn,
            Number(data.stock || 0),
            normalizeText(data.description),
            normalizeText(data.publisher),
            Boolean(data.recommended),
            id,
          ]
        );
        const updated = await fetchBook(client, id);
        await logActivity(client, req.user, "Buku", "Edit", `Mengedit buku "${updated.title}" oleh ${updated.author}`);
        return updated;
      });
      respond(res, { success: true, data: book, message: "Buku berhasil diperbarui." });
    } catch (error) {
      if (error.code === "ISBN_EXISTS" || error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

booksRouter.delete(
  "/books/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id ?? req.query.id);
    if (!id) return fail(res, "ID buku tidak valid.", 422);

    const result = await withTransaction(async (client) => {
      const existing = await client.query("SELECT title FROM books WHERE id = $1", [id]);
      if (existing.rowCount === 0) throw Object.assign(new Error("Buku tidak ditemukan."), { status: 404 });
      await client.query("DELETE FROM books WHERE id = $1", [id]);
      await logActivity(client, req.user, "Buku", "Hapus", `Menghapus buku "${existing.rows[0].title}" dari katalog`);
      return existing.rows[0].title;
    }).catch((error) => {
      if (error.status) return error;
      throw error;
    });

    if (result instanceof Error) return fail(res, result.message, result.status);
    respond(res, { success: true, message: "Buku berhasil dihapus." });
  })
);
