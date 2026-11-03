import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");
const dumpPath = join(rootDir, "database", "backup", "db_perpus_digital.dump");

const database = process.env.DB_NAME || "db_perpus_digital";
const host = process.env.DB_HOST || "127.0.0.1";
const port = String(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || "postgres";
const password = process.env.DB_PASSWORD || "";

const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
if (!localHosts.has(host) && !process.argv.includes("--force")) {
  console.error(
    `Restore dibatalkan: host "${host}" bukan database lokal. ` +
      "Skrip ini memakai pg_restore --clean dan akan menghapus data target. " +
      "Tambahkan --force hanya jika benar-benar yakin."
  );
  process.exit(1);
}

if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  console.error("Nama database hanya boleh berisi huruf, angka, dan underscore.");
  process.exit(1);
}

if (!existsSync(dumpPath)) {
  console.error(`File dump tidak ditemukan: ${dumpPath}`);
  process.exit(1);
}

async function ensureDatabase() {
  const client = new Client({ host, port: Number(port), user, password, database: "postgres" });
  await client.connect();
  try {
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`Database "${database}" dibuat.`);
    }
  } finally {
    await client.end();
  }
}

function restoreDump() {
  const env = { ...process.env, PGHOST: host, PGPORT: port, PGUSER: user };
  if (password) env.PGPASSWORD = password;
  try {
    execFileSync(
      "pg_restore",
      [
        "--no-owner",
        "--clean",
        "--if-exists",
        "-d",
        database,
        dumpPath,
      ],
      { stdio: "inherit", env }
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(
        "pg_restore tidak ditemukan. Tambahkan folder bin PostgreSQL ke PATH, " +
          'atau jalankan dengan PG_RESTORE="C:\\\\path\\\\ke\\\\pg_restore.exe".'
      );
      process.exit(1);
    }
    throw error;
  }
}

async function main() {
  await ensureDatabase();
  restoreDump();
  console.log("Restore database selesai.");
}

main().catch((error) => {
  console.error("Restore database gagal:", error);
  process.exit(1);
});
