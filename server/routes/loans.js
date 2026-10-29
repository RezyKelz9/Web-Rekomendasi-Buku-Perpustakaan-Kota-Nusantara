import { Router } from "express";
import { pool, withTransaction } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, parseId, respond } from "../http.js";
import { logActivity } from "../helpers.js";

export const loansRouter = Router();

const LOAN_SELECT = `
  SELECT l.id, l.user_id, l.book_id, l.borrowed_at, l.due_at, l.returned_at,
         l.duration, l.fine, l.is_favorite, l.payment_status, l.status,
         b.title, b.author, b.cover,
         u.nama_lengkap AS user_name, u.jenis_anggota AS user_type
  FROM loans l
  JOIN books b ON b.id = l.book_id
  JOIN users u ON u.id = l.user_id
`;

async function fetchLoan(client, id) {
  const result = await client.query(`${LOAN_SELECT} WHERE l.id = $1`, [id]);
  return result.rows[0] || null;
}

async function calculateServerFine(client, loan) {
  const [settingsResult, userResult] = await Promise.all([
    client.query("SELECT * FROM library_settings WHERE id = 1"),
    client.query("SELECT jenis_anggota FROM users WHERE id = $1", [loan.user_id]),
  ]);
  const settings = settingsResult.rows[0] || {};
  const memberType = String(userResult.rows[0]?.jenis_anggota || "Umum").toLowerCase();
  const overdueDays = Math.max(
    0,
    Math.ceil((Date.now() - new Date(loan.due_at).getTime()) / (1000 * 60 * 60 * 24))
  );
  if (overdueDays === 0) return 0;
  let perDay = Number(settings.denda_umum || 0);
  if (memberType.includes("dosen") || memberType.includes("pengajar")) {
    perDay = Number(settings.denda_dosen || 0);
  } else if (memberType.includes("pelajar")) {
    perDay = Number(settings.denda_pelajar || 0);
  }
  if (loan.is_favorite) perDay += Number(settings.denda_buku_favorit || 0);
  return perDay * overdueDays;
}

loansRouter.get(
  "/loans/index.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const requestedUserId = parseId(req.query.userId);
    const loanId = parseId(req.query.id);
    const status = req.query.status ? String(req.query.status) : null;

    let userId = requestedUserId;
    if (req.user.role !== "admin") {
      if (userId && userId !== req.user.id) {
        return fail(res, "Anda hanya dapat melihat pinjaman Anda sendiri.", 403);
      }
      userId = req.user.id;
    }

    const conditions = [];
    const params = [];
    if (userId) {
      params.push(userId);
      conditions.push(`l.user_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`l.status = $${params.length}`);
    }
    if (loanId) {
      params.push(loanId);
      conditions.push(`l.id = $${params.length}`);
    }

    let sql = LOAN_SELECT;
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += " ORDER BY l.borrowed_at DESC";
    const result = await pool.query(sql, params);
    respond(res, { success: true, data: result.rows });
  })
);

loansRouter.post(
  "/loans/index.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = input(req);
    let userId = parseId(data.userId) || req.user.id;
    const bookId = parseId(data.bookId);
    const duration = Math.max(1, Number(data.duration || 7));

    if (req.user.role !== "admin" && userId !== req.user.id) {
      return fail(res, "Anda hanya dapat membuat pinjaman untuk diri sendiri.", 403);
    }
    if (!bookId) return fail(res, "Buku tidak valid.", 422);

    try {
      const loan = await withTransaction(async (client) => {
        const book = await client.query(
          "SELECT id, title, stock FROM books WHERE id = $1 FOR UPDATE",
          [bookId]
        );
        if (book.rowCount === 0) throw Object.assign(new Error("Buku tidak ditemukan."), { status: 404 });

        const active = await client.query(
          `SELECT COUNT(*)::int AS total FROM loans
           WHERE book_id = $1 AND status IN ('Menunggu', 'Dipinjam')`,
          [bookId]
        );
        const available = Number(book.rows[0].stock) - Number(active.rows[0].total);
        if (available < 1) throw Object.assign(new Error("Buku tidak tersedia."), { status: 422 });

        const duplicate = await client.query(
          `SELECT id FROM loans
           WHERE user_id = $1 AND book_id = $2 AND status IN ('Menunggu', 'Dipinjam')`,
          [userId, bookId]
        );
        if (duplicate.rowCount > 0) {
          throw Object.assign(new Error("Anda sudah meminjam buku ini."), { status: 422 });
        }

        const inserted = await client.query(
          `INSERT INTO loans
             (user_id, book_id, borrowed_at, due_at, duration, fine, is_favorite, payment_status, status)
           VALUES ($1, $2, NOW(), NOW() + make_interval(days => $3), $3, 0, $4, 'unpaid', 'Menunggu')
           RETURNING id`,
          [userId, bookId, duration, Boolean(data.isFavorite)]
        );

        if (req.user.role === "admin" && userId !== req.user.id) {
          await logActivity(client, req.user, "Peminjaman", "Tambah", `Membuat peminjaman buku "${book.rows[0].title}"`);
        }
        return fetchLoan(client, inserted.rows[0].id);
      });
      respond(res, { success: true, data: loan, message: "Peminjaman berhasil dibuat." }, 201);
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

loansRouter.put(
  "/loans/index.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id);
    const action = String(data.action || "");
    if (!id) return fail(res, "ID peminjaman tidak valid.", 422);
    if (!["approve", "reject", "return", "pay", "confirm"].includes(action)) {
      return fail(res, "Aksi tidak dikenal.", 422);
    }

    try {
      const loan = await withTransaction(async (client) => {
        const result = await client.query("SELECT * FROM loans WHERE id = $1 FOR UPDATE", [id]);
        const current = result.rows[0];
        if (!current) throw Object.assign(new Error("Peminjaman tidak ditemukan."), { status: 404 });

        const isOwner = current.user_id === req.user.id;
        const isAdmin = req.user.role === "admin";
        if (!isAdmin && !isOwner) {
          throw Object.assign(new Error("Anda tidak berhak mengubah peminjaman ini."), { status: 403 });
        }
        if (!isAdmin && !["return", "pay"].includes(action)) {
          throw Object.assign(new Error("Aksi ini hanya dapat dilakukan administrator."), { status: 403 });
        }

        const fine = Number(data.fine || 0);

        if (action === "approve") {
          if (current.status !== "Menunggu") {
            throw Object.assign(new Error("Peminjaman tidak berada pada status menunggu."), { status: 422 });
          }
          await client.query(
            `UPDATE loans
             SET status = 'Dipinjam', due_at = NOW() + make_interval(days => $1)
             WHERE id = $2`,
            [Number(current.duration || 7), id]
          );
          await logActivity(client, req.user, "Peminjaman", "Setujui", "Menyetujui peminjaman buku");
        } else if (action === "reject") {
          if (current.status !== "Menunggu") {
            throw Object.assign(new Error("Peminjaman tidak berada pada status menunggu."), { status: 422 });
          }
          await client.query("UPDATE loans SET status = 'Ditolak' WHERE id = $1", [id]);
          await logActivity(client, req.user, "Peminjaman", "Tolak", "Menolak peminjaman buku");
        } else if (action === "return") {
          if (current.status !== "Dipinjam") {
            throw Object.assign(new Error("Buku tidak sedang dipinjam."), { status: 422 });
          }
          const computedFine = await calculateServerFine(client, current);
          const paymentStatus = computedFine > 0 ? "unpaid" : "paid";
          await client.query(
            `UPDATE loans
             SET status = 'Dikembalikan', returned_at = NOW(), fine = $1, payment_status = $2
             WHERE id = $3`,
            [computedFine, paymentStatus, id]
          );
          await logActivity(client, req.user, "Peminjaman", "Kembalikan", "Mengembalikan buku");
        } else if (action === "pay") {
          if (current.payment_status === "paid") {
            throw Object.assign(new Error("Denda sudah dibayar."), { status: 422 });
          }
          await client.query("UPDATE loans SET payment_status = 'paid' WHERE id = $1", [id]);
        } else if (action === "confirm") {
          if (Number(current.fine) > 0 && current.payment_status === "unpaid") {
            throw Object.assign(new Error("Anggota belum membayar denda."), { status: 422 });
          }
          await client.query(
            `UPDATE loans
             SET status = 'Selesai', returned_at = COALESCE(returned_at, NOW()), fine = $1
             WHERE id = $2`,
            [fine || Number(current.fine), id]
          );
          await logActivity(client, req.user, "Peminjaman", "Konfirmasi", "Mengkonfirmasi pengembalian buku");
        }

        return fetchLoan(client, id);
      });
      respond(res, { success: true, data: loan, message: "Status peminjaman berhasil diperbarui." });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

loansRouter.delete(
  "/loans/index.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id ?? req.query.id);
    if (!id) return fail(res, "ID peminjaman tidak valid.", 422);

    try {
      await withTransaction(async (client) => {
        const result = await client.query("SELECT * FROM loans WHERE id = $1 FOR UPDATE", [id]);
        const current = result.rows[0];
        if (!current) throw Object.assign(new Error("Peminjaman tidak ditemukan."), { status: 404 });
        if (req.user.role !== "admin" && current.user_id !== req.user.id) {
          throw Object.assign(new Error("Anda tidak berhak menghapus peminjaman ini."), { status: 403 });
        }
        if (req.user.role !== "admin" && current.status !== "Menunggu") {
          throw Object.assign(new Error("Hanya peminjaman yang menunggu dapat dibatalkan."), { status: 422 });
        }
        await client.query("DELETE FROM loans WHERE id = $1", [id]);
        if (req.user.role === "admin") {
          await logActivity(client, req.user, "Peminjaman", "Hapus", "Menghapus data peminjaman");
        }
      });
      respond(res, { success: true, message: "Peminjaman berhasil dihapus." });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);
