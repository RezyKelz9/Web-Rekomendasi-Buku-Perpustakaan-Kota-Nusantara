import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, parseId, respond } from "../http.js";
import { logActivity, normalizeText } from "../helpers.js";

export const usersRouter = Router();

const USER_FIELDS = `
  id, nama_lengkap, email, username, nip, nomor_hp, alamat, jenis_anggota,
  membership_type, role, status, member_code, created_at
`;

usersRouter.get(
  "/users/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const role = req.query.role ? String(req.query.role) : null;
    const params = [];
    let sql = `SELECT ${USER_FIELDS} FROM users`;
    if (role) {
      params.push(role);
      sql += " WHERE role = $1";
    }
    sql += " ORDER BY created_at DESC";
    const result = await pool.query(sql, params);
    respond(res, { success: true, data: result.rows });
  })
);

usersRouter.put(
  "/users/index.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const requestedId = parseId(data.id);
    const targetId = requestedId || req.user.id;
    const isAdmin = req.user.role === "admin";
    if (targetId !== req.user.id && !isAdmin) {
      return fail(res, "Anda hanya dapat mengubah profil sendiri.", 403);
    }

    const fieldMap = {
      namaLengkap: "nama_lengkap",
      nomorHP: "nomor_hp",
      alamat: "alamat",
      email: "email",
      username: "username",
      nip: "nip",
      jenisAnggota: "jenis_anggota",
      membershipType: "membership_type",
      role: "role",
      status: "status",
    };

    try {
      const user = await withTransaction(async (client) => {
        const existing = await client.query("SELECT * FROM users WHERE id = $1", [targetId]);
        if (existing.rowCount === 0) throw Object.assign(new Error("Pengguna tidak ditemukan."), { status: 404 });

        const assignments = [];
        const params = [];
        for (const [camel, column] of Object.entries(fieldMap)) {
          if (data[camel] === undefined) continue;
          if ((camel === "role" || camel === "status") && !isAdmin) {
            throw Object.assign(new Error("Hanya administrator yang dapat mengubah role/status."), { status: 403 });
          }
          params.push(normalizeText(data[camel]));
          assignments.push(`${column} = $${params.length}`);
        }

        if (data.password) {
          if (!isAdmin && targetId !== req.user.id) {
            throw Object.assign(new Error("Tidak diizinkan mengubah kata sandi pengguna lain."), { status: 403 });
          }
          params.push(await bcrypt.hash(String(data.password), 10));
          assignments.push(`password_hash = $${params.length}`);
        }

        if (assignments.length === 0) {
          throw Object.assign(new Error("Tidak ada data yang diubah."), { status: 422 });
        }

        params.push(targetId);
        const updated = await client.query(
          `UPDATE users SET ${assignments.join(", ")} WHERE id = $${params.length}
           RETURNING ${USER_FIELDS}`,
          params
        );

        if (isAdmin && targetId !== req.user.id) {
          await logActivity(client, req.user, "Anggota", "Edit", `Mengubah data akun "${updated.rows[0].nama_lengkap}" (${updated.rows[0].email})`);
        }
        return updated.rows[0];
      });

      respond(res, { success: true, data: user, user, message: "Data pengguna berhasil diperbarui." });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);

usersRouter.delete(
  "/users/index.php",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const id = parseId(data.id ?? req.query.id);
    if (!id) return fail(res, "ID pengguna tidak valid.", 422);
    if (id === req.user.id) return fail(res, "Anda tidak dapat menghapus akun sendiri.", 409);

    try {
      const deleted = await withTransaction(async (client) => {
        const existing = await client.query("SELECT nama_lengkap, email FROM users WHERE id = $1", [id]);
        if (existing.rowCount === 0) throw Object.assign(new Error("Pengguna tidak ditemukan."), { status: 404 });
        await client.query("DELETE FROM users WHERE id = $1", [id]);
        await logActivity(client, req.user, "Anggota", "Hapus", `Menghapus akun anggota "${existing.rows[0].nama_lengkap}" (${existing.rows[0].email})`);
        return existing.rows[0];
      });
      respond(res, { success: true, message: `Akun ${deleted.email} berhasil dihapus.` });
    } catch (error) {
      if (error.status) return fail(res, error.message, error.status);
      return handleDatabaseError(res, error);
    }
  })
);
