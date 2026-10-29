import { Router } from "express";
import { pool, withTransaction } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, respond } from "../http.js";
import { logActivity, mapSettings } from "../helpers.js";

export const settingsRouter = Router();

const SETTINGS_FIELDS = [
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

settingsRouter.get(
  "/settings/index.php",
  authenticate,
  asyncHandler(async (_req, res) => {
    const result = await pool.query("SELECT * FROM library_settings WHERE id = 1");
    respond(res, { success: true, data: mapSettings(result.rows[0]) });
  })
);

settingsRouter.put(
  "/settings/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const assignments = [];
    const params = [];

    for (const [camel, column] of SETTINGS_FIELDS) {
      if (data[camel] === undefined) continue;
      const value = Number(data[camel]);
      if (!Number.isFinite(value) || value < 0) {
        return fail(res, `Nilai ${camel} tidak valid.`, 422);
      }
      params.push(Math.floor(value));
      assignments.push(`${column} = $${params.length}`);
    }

    if (assignments.length === 0) return fail(res, "Tidak ada pengaturan yang diubah.", 422);

    try {
      const settings = await withTransaction(async (client) => {
        await client.query(
          `UPDATE library_settings SET ${assignments.join(", ")} WHERE id = 1`,
          params
        );
        await logActivity(
          client,
          req.user,
          "Pengaturan",
          "Simpan",
          "Memperbarui ketentuan peminjaman dan denda"
        );
        const result = await client.query("SELECT * FROM library_settings WHERE id = 1");
        return mapSettings(result.rows[0]);
      });
      respond(res, { success: true, data: settings, message: "Pengaturan berhasil disimpan." });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  })
);

settingsRouter.get(
  "/loan-rules/index.php",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(
      `SELECT id::text AS id, type, duration_days AS duration,
              max_renewals AS "maxRenewals", fine_per_day AS fine,
              description, eligibility
       FROM loan_rules
       ORDER BY id`
    );
    respond(res, { success: true, data: result.rows });
  })
);
