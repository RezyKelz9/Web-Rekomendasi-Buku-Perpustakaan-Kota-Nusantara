import { randomBytes } from "node:crypto";

export function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export function generateToken() {
  return randomBytes(32).toString("hex");
}

const LOAN_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateLoanCode(date = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/-/g, "");
  const bytes = randomBytes(4);
  let suffix = "";
  for (const byte of bytes) {
    suffix += LOAN_CODE_ALPHABET[byte % LOAN_CODE_ALPHABET.length];
  }
  return `PJM-${day}-${suffix}`;
}

export function memberPrefix(jenisAnggota, role) {
  if (role !== "member") {
    if (role === "admin") return "ADM";
    if (role === "staff") return "STF";
    if (role === "petugasRak") return "PTR";
    return "ADM";
  }
  const normalized = String(jenisAnggota || "").toLowerCase();
  if (normalized.includes("pelajar")) return "PLJ";
  if (normalized.includes("dosen") || normalized.includes("pengajar")) return "DOS";
  return "UMM";
}

export async function generateMemberCode(client, jenisAnggota, role) {
  const prefix = memberPrefix(jenisAnggota, role);
  const result = await client.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(member_code FROM 5) AS INTEGER)), 0) AS max_number
     FROM users
     WHERE member_code LIKE $1`,
    [`${prefix}-%`]
  );
  const next = Number(result.rows[0]?.max_number || 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export function normalizeIsbn(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function normalizeText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function logActivity(client, authUser, module, action, description) {
  await client.query(
    `INSERT INTO activity_logs (admin_id, admin_name, admin_email, module, action, description)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      authUser?.id ?? null,
      authUser?.nama_lengkap ?? "Sistem",
      authUser?.email ?? "system@perpus.local",
      module,
      action,
      description,
    ]
  );
}

export function mapSettings(row) {
  return {
    durasiUmum: row.durasi_umum,
    durasiPelajar: row.durasi_pelajar,
    durasiDosen: row.durasi_dosen,
    dendaUmum: row.denda_umum,
    dendaPelajar: row.denda_pelajar,
    dendaDosen: row.denda_dosen,
    dendaBukuFavorit: row.denda_buku_favorit,
    batasBukuUmum: row.batas_buku_umum,
    batasBukuPelajar: row.batas_buku_pelajar,
    batasBukuDosen: row.batas_buku_dosen,
  };
}
