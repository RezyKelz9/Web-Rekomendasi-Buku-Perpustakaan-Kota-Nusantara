import { pool } from "./db.js";
import { fail } from "./http.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return fail(res, "Autentikasi diperlukan.", 401);

  const result = await pool.query(
    "SELECT * FROM users WHERE auth_token = $1 AND status = 'active' LIMIT 1",
    [match[1]]
  );
  const user = result.rows[0];
  if (!user) return fail(res, "Token tidak valid atau sesi telah berakhir.", 401);
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "Akses administrator diperlukan.", 403);
  }
  next();
}
