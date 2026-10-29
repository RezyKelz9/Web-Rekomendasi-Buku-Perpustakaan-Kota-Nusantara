import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../db.js";
import { authenticate } from "../auth.js";
import { asyncHandler, fail, handleDatabaseError, input, respond } from "../http.js";
import { generateMemberCode, generateToken, publicUser } from "../helpers.js";

export const authRouter = Router();

authRouter.post(
  "/auth/login.php",
  asyncHandler(async (req, res) => {
    const data = input(req);
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return fail(res, "Email atau password salah.", 401);
    }
    if (user.status !== "active") {
      return fail(res, "Akun belum aktif atau diblokir.", 403);
    }
    if (data.requiredRole === "admin" && user.role !== "admin") {
      return fail(res, "Akun ini bukan administrator. Gunakan portal anggota untuk masuk.", 403);
    }
    if (data.requiredRole === "member" && user.role === "admin") {
      return fail(res, "Gunakan portal administrasi untuk masuk.", 403);
    }

    const token = generateToken();
    await pool.query("UPDATE users SET auth_token = $1 WHERE id = $2", [token, user.id]);
    const userData = { ...publicUser(user), auth_token: token };
    respond(res, {
      success: true,
      message: "Login berhasil.",
      user: userData,
      data: userData,
    });
  })
);

authRouter.post(
  "/auth/register.php",
  asyncHandler(async (req, res) => {
    const data = input(req);
    const namaLengkap = String(data.namaLengkap || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    if (!namaLengkap || !email || !password) {
      return fail(res, "Data pendaftaran belum lengkap.", 422);
    }

    try {
      const user = await withTransaction(async (client) => {
        const exists = await client.query("SELECT id FROM users WHERE email = $1", [email]);
        if (exists.rowCount > 0) throw Object.assign(new Error("Email sudah terdaftar."), { status: 409, code: "EMAIL_EXISTS" });

        const jenisAnggota = String(data.jenisAnggota || "Umum");
        const membershipType = String(data.membershipType || "Umum");
        const passwordHash = await bcrypt.hash(password, 10);
        const inserted = await client.query(
          `INSERT INTO users
             (nama_lengkap, email, password_hash, nomor_hp, alamat, jenis_anggota,
              membership_type, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'member', 'active')
           RETURNING *`,
          [
            namaLengkap,
            email,
            passwordHash,
            data.nomorHP || null,
            data.alamat || null,
            jenisAnggota,
            membershipType,
          ]
        );
        const created = inserted.rows[0];
        const memberCode = await generateMemberCode(client, jenisAnggota, "member");
        const updated = await client.query(
          `UPDATE users SET member_code = $1 WHERE id = $2
           RETURNING id, nama_lengkap, email, username, nip, alamat, nomor_hp,
                     jenis_anggota, membership_type, role, status, member_code, created_at`,
          [memberCode, created.id]
        );
        return updated.rows[0];
      });

      respond(res, {
        success: true,
        message: "Registrasi berhasil.",
        user,
        data: user,
      });
    } catch (error) {
      if (error.code === "EMAIL_EXISTS") return fail(res, error.message, 409);
      return handleDatabaseError(res, error);
    }
  })
);

authRouter.post(
  "/auth/register-admin.php",
  asyncHandler(async (req, res) => {
    const data = input(req);
    const required = ["namaLengkap", "email", "password", "username", "nip"];
    if (required.some((field) => !String(data[field] || "").trim())) {
      return fail(res, "Data admin belum lengkap.", 422);
    }

    try {
      const user = await withTransaction(async (client) => {
        const email = String(data.email).trim().toLowerCase();
        const exists = await client.query("SELECT id FROM users WHERE email = $1", [email]);
        if (exists.rowCount > 0) throw Object.assign(new Error("Email sudah terdaftar."), { status: 409, code: "EMAIL_EXISTS" });

        const role = ["admin", "staff", "petugasRak"].includes(data.role) ? data.role : "admin";
        const passwordHash = await bcrypt.hash(String(data.password), 10);
        const inserted = await client.query(
          `INSERT INTO users
             (nama_lengkap, email, username, nip, password_hash, nomor_hp, alamat,
              jenis_anggota, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
           RETURNING *`,
          [
            String(data.namaLengkap).trim(),
            email,
            String(data.username).trim(),
            String(data.nip).trim(),
            passwordHash,
            data.nomorHP || null,
            data.alamat || "Kantor Perpustakaan Kota Nusantara",
            data.jenisAnggota || null,
            role,
          ]
        );
        const created = inserted.rows[0];
        const memberCode = await generateMemberCode(client, "", role);
        const updated = await client.query(
          `UPDATE users SET member_code = $1 WHERE id = $2
           RETURNING id, nama_lengkap, email, username, nip, alamat, nomor_hp,
                     jenis_anggota, membership_type, role, status, member_code, created_at`,
          [memberCode, created.id]
        );
        return updated.rows[0];
      });

      respond(res, {
        success: true,
        message: "Registrasi admin berhasil.",
        user,
        data: user,
      }, 201);
    } catch (error) {
      if (error.code === "EMAIL_EXISTS") return fail(res, error.message, 409);
      return handleDatabaseError(res, error);
    }
  })
);

authRouter.get(
  "/auth/me.php",
  authenticate,
  asyncHandler(async (req, res) => {
    respond(res, { success: true, user: publicUser(req.user), data: publicUser(req.user) });
  })
);

authRouter.post(
  "/auth/logout.php",
  authenticate,
  asyncHandler(async (req, res) => {
    await pool.query("UPDATE users SET auth_token = NULL WHERE id = $1", [req.user.id]);
    respond(res, { success: true, message: "Logout berhasil." });
  })
);

authRouter.post(
  "/auth/change-password.php",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = input(req);
    const currentPassword = String(data.currentPassword || "");
    const newPassword = String(data.newPassword || "");
    if (!currentPassword || !newPassword) {
      return fail(res, "Kata sandi lama dan baru wajib diisi.", 422);
    }
    if (newPassword.length < 6) {
      return fail(res, "Kata sandi baru minimal 6 karakter.", 422);
    }
    const valid = await bcrypt.compare(currentPassword, req.user.password_hash);
    if (!valid) return fail(res, "Kata sandi lama tidak sesuai.", 401);

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.user.id]);
    respond(res, { success: true, message: "Kata sandi berhasil diubah." });
  })
);
