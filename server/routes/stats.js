import { Router } from "express";
import { pool } from "../db.js";
import { asyncHandler, respond } from "../http.js";

export const statsRouter = Router();

statsRouter.get(
  "/stats/index.php",
  asyncHandler(async (_req, res) => {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM books) AS total_books,
        (
          SELECT COUNT(*)::int FROM books b
          WHERE b.stock - COALESCE((
            SELECT COUNT(*) FROM loans l
            WHERE l.book_id = b.id AND l.status IN ('Dipinjam', 'Menunggu')
          ), 0) > 0
        ) AS available_books,
        (SELECT COUNT(*)::int FROM categories) AS total_categories,
        (SELECT COUNT(*)::int FROM shelves) AS total_shelves,
        (SELECT COUNT(*)::int FROM users WHERE role = 'member' AND status = 'active') AS total_members,
        (SELECT COUNT(*)::int FROM loans) AS total_loans,
        (SELECT COUNT(*)::int FROM loans WHERE status IN ('Dipinjam', 'Menunggu')) AS active_loans
    `);

    const row = result.rows[0];
    respond(res, {
      success: true,
      data: {
        totalBooks: row.total_books,
        availableBooks: row.available_books,
        totalCategories: row.total_categories,
        totalShelves: row.total_shelves,
        totalMembers: row.total_members,
        totalLoans: row.total_loans,
        activeLoans: row.active_loans,
      },
    });
  })
);
