import { Router } from "express";
import { pool, withTransaction } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, parseId, respond } from "../http.js";
import { logActivity, normalizeText } from "../helpers.js";

export const categoriesRouter = Router();

const CATEGORY_SELECT = `
  SELECT c.id, c.kode, c.name, c.color, c.icon, c.description,
         COUNT(b.id)::int AS book_count
  FROM categories c
  LEFT JOIN books b ON b.category_id = c.id
`;

categoriesRouter.get(
  "/categories/index.php",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(`${CATEGORY_SELECT} GROUP BY c.id ORDER BY c.name`);
    respond(res, { success: true, data: result.rows });
  })
);

categoriesRouter.post(
  "/categories/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const kode = String(data.kode || "").trim().toLowerCase();
    const name = String(data.name || "").trim();
    if (!kode || !name) return fail(res, "Kode dan nama kategori wajib diisi.", 422);

    try {
      const category = await withTransaction(async (client) => {
        const inserted = await client.query(
          `INSERT INTO categories (kode, name, color, icon, description)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [kode, name, normalizeText(data.color), normalizeText(data.icon), normalizeText(data.description)]
        );
        await logActivity(client, req.user, "Kategori", "Tambah", `Menambahkan kategori baru "${name}"`);
        const row = await client.query(
          `SELECT id, kode, name, color, icon, description, 0::int AS book_count
           FROM categories WHERE id = $1`,
          [inserted.rows[0].id]
        );
        return row.rows[0];
      });
      respond(res, { success: true, data: category, message: "Kategori berhasil ditambahkan." }, 201);
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  })
);

categoriesRouter.put(
  "/categories/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id);
    if (!id) return fail(res, "ID kategori tidak valid.", 422);
    const name = String(data.name || "").trim();
    if (!name) return fail(res, "Nama kategori wajib diisi.", 422);

    try {
      const category = await withTransaction(async (client) => {
        const existing = await client.query("SELECT * FROM categories WHERE id = $1", [id]);
        if (existing.rowCount === 0) throw Object.assign(new Error("Kategori tidak ditemukan."), { status: 404 });
        const kode = String(data.kode || existing.rows[0].kode).trim().toLowerCase();
        await client.query(
          `UPDATE categories SET kode = $1, name = $2, color = $3, icon = $4, description = $5
           WHERE id = $6`,
          [kode, name, normalizeText(data.color), normalizeText(data.icon), normalizeText(data.description), id]
        );
        await logActivity(client, req.user, "Kategori", "Edit", `Mengedit kategori "${name}"`);
        const row = await client.query(
          `${CATEGORY_SELECT} WHERE c.id = $1 GROUP BY c.id`,
          [id]
        );
        return row.rows[0];
      });
      respond(res, { success: true, data: category, message: "Kategori berhasil diperbarui." });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

categoriesRouter.delete(
  "/categories/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id ?? req.query.id);
    if (!id) return fail(res, "ID kategori tidak valid.", 422);

    try {
      const deleted = await withTransaction(async (client) => {
        const existing = await client.query("SELECT name FROM categories WHERE id = $1", [id]);
        if (existing.rowCount === 0) throw Object.assign(new Error("Kategori tidak ditemukan."), { status: 404 });
        const used = await client.query("SELECT COUNT(*)::int AS total FROM books WHERE category_id = $1", [id]);
        if (used.rows[0].total > 0) {
          throw Object.assign(new Error(`Kategori masih digunakan oleh ${used.rows[0].total} buku.`), { status: 409 });
        }
        await client.query("DELETE FROM categories WHERE id = $1", [id]);
        await logActivity(client, req.user, "Kategori", "Hapus", `Menghapus kategori "${existing.rows[0].name}"`);
        return existing.rows[0].name;
      });
      respond(res, { success: true, message: `Kategori "${deleted}" berhasil dihapus.` });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);
