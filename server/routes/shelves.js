import { Router } from "express";
import { pool, withTransaction } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, parseId, respond } from "../http.js";
import { logActivity, normalizeText } from "../helpers.js";

export const shelvesRouter = Router();

const SHELF_SELECT = `
  SELECT s.id, s.kode, s.name, s.location, s.floor, s.capacity,
         COALESCE(STRING_AGG(c.kode, ',' ORDER BY c.kode), '') AS categories
  FROM shelves s
  LEFT JOIN shelf_categories sc ON sc.shelf_id = s.id
  LEFT JOIN categories c ON c.id = sc.category_id
`;

function normalizeCodes(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function replaceShelfCategories(client, shelfId, codes) {
  await client.query("DELETE FROM shelf_categories WHERE shelf_id = $1", [shelfId]);
  for (const code of [...new Set(codes)]) {
    const category = await client.query("SELECT id FROM categories WHERE kode = $1", [code]);
    if (category.rowCount === 0) {
      throw Object.assign(new Error(`Kategori "${code}" tidak ditemukan.`), { status: 422 });
    }
    await client.query(
      "INSERT INTO shelf_categories (shelf_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [shelfId, category.rows[0].id]
    );
  }
}

async function fetchShelf(client, id) {
  const result = await client.query(`${SHELF_SELECT} WHERE s.id = $1 GROUP BY s.id`, [id]);
  return result.rows[0] || null;
}

shelvesRouter.get(
  "/shelves/index.php",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(`${SHELF_SELECT} GROUP BY s.id ORDER BY s.kode`);
    respond(res, { success: true, data: result.rows });
  })
);

shelvesRouter.post(
  "/shelves/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const kode = String(data.kode || "").trim().toUpperCase();
    const name = String(data.name || "").trim();
    if (!kode || !name) return fail(res, "Kode dan nama rak wajib diisi.", 422);

    try {
      const shelf = await withTransaction(async (client) => {
        const inserted = await client.query(
          `INSERT INTO shelves (kode, name, location, floor, capacity)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [kode, name, normalizeText(data.location), Number(data.floor || 1), Number(data.capacity || 0)]
        );
        await replaceShelfCategories(client, inserted.rows[0].id, normalizeCodes(data.categories));
        await logActivity(client, req.user, "Rak", "Tambah", `Menambahkan rak baru "${name}"`);
        return fetchShelf(client, inserted.rows[0].id);
      });
      respond(res, { success: true, data: shelf, message: "Rak berhasil ditambahkan." }, 201);
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

shelvesRouter.put(
  "/shelves/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id);
    if (!id) return fail(res, "ID rak tidak valid.", 422);
    const name = String(data.name || "").trim();
    if (!name) return fail(res, "Nama rak wajib diisi.", 422);

    try {
      const shelf = await withTransaction(async (client) => {
        const existing = await client.query("SELECT * FROM shelves WHERE id = $1", [id]);
        if (existing.rowCount === 0) throw Object.assign(new Error("Rak tidak ditemukan."), { status: 404 });
        const kode = String(data.kode || existing.rows[0].kode).trim().toUpperCase();
        await client.query(
          `UPDATE shelves SET kode = $1, name = $2, location = $3, floor = $4, capacity = $5
           WHERE id = $6`,
          [kode, name, normalizeText(data.location), Number(data.floor || 1), Number(data.capacity || 0), id]
        );
        await replaceShelfCategories(client, id, normalizeCodes(data.categories));
        await logActivity(client, req.user, "Rak", "Edit", `Mengedit rak "${name}"`);
        return fetchShelf(client, id);
      });
      respond(res, { success: true, data: shelf, message: "Rak berhasil diperbarui." });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

shelvesRouter.delete(
  "/shelves/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id ?? req.query.id);
    if (!id) return fail(res, "ID rak tidak valid.", 422);

    try {
      const deleted = await withTransaction(async (client) => {
        const existing = await client.query("SELECT name FROM shelves WHERE id = $1", [id]);
        if (existing.rowCount === 0) throw Object.assign(new Error("Rak tidak ditemukan."), { status: 404 });
        const used = await client.query("SELECT COUNT(*)::int AS total FROM books WHERE shelf_id = $1", [id]);
        if (used.rows[0].total > 0) {
          throw Object.assign(new Error(`Rak masih digunakan oleh ${used.rows[0].total} buku.`), { status: 409 });
        }
        await client.query("DELETE FROM shelves WHERE id = $1", [id]);
        await logActivity(client, req.user, "Rak", "Hapus", `Menghapus rak "${existing.rows[0].name}"`);
        return existing.rows[0].name;
      });
      respond(res, { success: true, message: `Rak "${deleted}" berhasil dihapus.` });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);
