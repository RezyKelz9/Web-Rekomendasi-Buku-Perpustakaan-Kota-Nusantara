import "dotenv/config";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");
const schemaPath = join(rootDir, "database", "postgres", "schema.sql");
const seedPath = join(__dirname, "seed.ts");

const database = process.env.DB_NAME || "db_perpus_digital";
const host = process.env.DB_HOST || "127.0.0.1";
const port = Number(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || "postgres";
const password = process.env.DB_PASSWORD || "";

if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  console.error("Nama database hanya boleh berisi huruf, angka, dan underscore.");
  process.exit(1);
}

async function ensureDatabase() {
  const client = new Client({ host, port, user, password, database: "postgres" });
  await client.connect();
  try {
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`Database "${database}" dibuat.`);
    } else {
      console.log(`Database "${database}" sudah ada.`);
    }
  } finally {
    await client.end();
  }
}

async function applySchema() {
  const client = new Client({ host, port, user, password, database });
  await client.connect();
  try {
    const sql = readFileSync(schemaPath, "utf8");
    await client.query(sql);
    console.log("Schema PostgreSQL berhasil diterapkan.");
  } finally {
    await client.end();
  }
}

async function runSeed() {
  execFileSync(process.execPath, [seedPath], {
    stdio: "inherit",
    cwd: rootDir,
    env: process.env,
  });
}

async function main() {
  await ensureDatabase();
  await applySchema();
  await runSeed();
  console.log("Setup database selesai.");
}

main().catch((error) => {
  console.error("Setup database gagal:", error);
  process.exit(1);
});
