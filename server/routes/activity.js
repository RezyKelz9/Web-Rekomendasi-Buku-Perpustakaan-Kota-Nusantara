import { Router } from "express";
import { pool } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, respond } from "../http.js";
import { logActivity } from "../helpers.js";

export const activityRouter = Router();

activityRouter.get(
  "/activity/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit || 500), 1), 1000);
    const module = req.query.module ? String(req.query.module) : null;
    const action = req.query.action ? String(req.query.action) : null;
    const params = [];
    const conditions = [];
    if (module) {
      params.push(module);
      conditions.push(`module = $${params.length}`);
    }
    if (action) {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }
    params.push(limit);
    let sql = `
      SELECT id::text AS id, created_at AS timestamp, admin_name AS "adminName",
             admin_email AS "adminEmail", module, action, description
      FROM activity_logs
    `;
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    const result = await pool.query(sql, params);
    respond(res, { success: true, data: result.rows });
  })
);

activityRouter.post(
  "/activity/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    if (!data.module || !data.action || !String(data.description || "").trim()) {
      return fail(res, "Data aktivitas belum lengkap.", 422);
    }
    try {
      const result = await pool.query(
        `INSERT INTO activity_logs (admin_id, admin_name, admin_email, module, action, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id::text AS id, created_at AS timestamp, admin_name AS "adminName",
                   admin_email AS "adminEmail", module, action, description`,
        [
          req.user.id,
          req.user.nama_lengkap,
          req.user.email,
          String(data.module),
          String(data.action),
          String(data.description).trim(),
        ]
      );
      respond(res, { success: true, data: result.rows[0] }, 201);
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  })
);

activityRouter.delete(
  "/activity/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await pool.query("DELETE FROM activity_logs");
    respond(res, { success: true, message: "Riwayat aktivitas berhasil dihapus." });
  })
);
