import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, parseId, respond } from "../http.js";

export const ratingsRouter = Router();

ratingsRouter.get(
  "/ratings/index.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const loanId = parseId(req.query.loanId);
    const requestedUserId = parseId(req.query.userId);
    const conditions = [];
    const params = [];

    if (req.user.role !== "admin") {
      if (requestedUserId && requestedUserId !== req.user.id) {
        return fail(res, "Anda hanya dapat melihat rating sendiri.", 403);
      }
      params.push(req.user.id);
      conditions.push(`r.user_id = $${params.length}`);
    } else if (requestedUserId) {
      params.push(requestedUserId);
      conditions.push(`r.user_id = $${params.length}`);
    }

    if (loanId) {
      params.push(loanId);
      conditions.push(`r.loan_id = $${params.length}`);
    }

    let sql = `
      SELECT r.id, r.loan_id, r.user_id, r.rating, r.created_at,
             l.book_id, b.title
      FROM ratings r
      JOIN loans l ON l.id = r.loan_id
      JOIN books b ON b.id = l.book_id
    `;
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += " ORDER BY r.created_at DESC";

    const result = await pool.query(sql, params);
    respond(res, { success: true, data: result.rows });
  })
);

ratingsRouter.post(
  "/ratings/index.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const loanId = parseId(data.loanId);
    const requestedUserId = parseId(data.userId);
    const rating = Number(data.rating);
    const userId = req.user.role === "admin" && requestedUserId ? requestedUserId : req.user.id;

    if (!loanId || rating < 1 || rating > 5) {
      return fail(res, "Data rating tidak valid.", 422);
    }
    if (req.user.role !== "admin" && requestedUserId && requestedUserId !== req.user.id) {
      return fail(res, "Anda hanya dapat memberi rating untuk pinjaman sendiri.", 403);
    }

    try {
      const loan = await pool.query("SELECT id, user_id FROM loans WHERE id = $1", [loanId]);
      if (loan.rowCount === 0) return fail(res, "Peminjaman tidak ditemukan.", 404);
      if (req.user.role !== "admin" && loan.rows[0].user_id !== req.user.id) {
        return fail(res, "Peminjaman tidak ditemukan.", 404);
      }

      const result = await pool.query(
        `INSERT INTO ratings (loan_id, user_id, rating, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (loan_id) DO UPDATE SET
           rating = EXCLUDED.rating,
           user_id = EXCLUDED.user_id,
           created_at = NOW()
         RETURNING id, loan_id, user_id, rating, created_at`,
        [loanId, loan.rows[0].user_id, rating]
      );
      respond(res, { success: true, data: result.rows[0], message: "Rating berhasil disimpan." });
    } catch (error) {
      return handleDatabaseError(res, error);
    }
  })
);
