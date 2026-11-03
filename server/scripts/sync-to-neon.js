import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const TABLES = ["categories", "shelves", "shelf_categories", "books", "loan_rules"];
const BOOK_FIELDS = [
  "title",
  "author",
  "category_id",
  "shelf_id",
  "shelf_position",
  "cover",
  "rating",
  "published_year",
  "pages",
  "isbn",
  "stock",
  "description",
  "publisher",
  "recommended",
];

const args = process.argv.slice(2);

function option(name) {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

if (args.includes("--help")) {
  console.log(
    [
      "Sinkron konten PostgreSQL lokal ke Neon (tanpa users/loans/ratings/logs).",
      "",
      "Pemakaian:",
      "  npm run db:sync:neon                     # dry-run",
      "  npm run db:sync:neon -- --apply          # terapkan",
      "  npm run db:sync:neon -- --only=books,categories",
      "",
      `Tabel: ${TABLES.join(", ")}`,
      "Membutuhkan NEON_DATABASE_URL di .env dengan host *.neon.tech.",
    ].join("\n")
  );
  process.exit(0);
}

const apply = args.includes("--apply");
const only = option("only");
const selected = only
  ? only.split(",").map((item) => item.trim()).filter(Boolean)
  : TABLES;
const unknown = selected.filter((table) => !TABLES.includes(table));
if (unknown.length > 0) {
  console.error(`Tabel tidak dikenal: ${unknown.join(", ")}`);
  process.exit(1);
}
const wants = (table) => selected.includes(table);

const neonUrl = process.env.NEON_DATABASE_URL;
if (!neonUrl) {
  console.error(
    "NEON_DATABASE_URL belum diisi. Tambahkan connection string Neon ke .env " +
      "(host *.neon.tech, akhiran ?sslmode=require)."
  );
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(neonUrl);
} catch {
  console.error("NEON_DATABASE_URL bukan URL yang valid.");
  process.exit(1);
}

parsedUrl.searchParams.delete("sslmode");

if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
  console.error("NEON_DATABASE_URL harus memakai protokol postgres.");
  process.exit(1);
}

if (!parsedUrl.hostname.endsWith(".neon.tech")) {
  console.error(
    `Target harus host Neon (*.neon.tech), bukan "${parsedUrl.hostname}". ` +
      "Skrip ini tidak boleh menulis ke database lain."
  );
  process.exit(1);
}

const localConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "db_perpus_digital",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
};

let targetClient;

function normText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normIsbn(value) {
  return String(value ?? "").toUpperCase().replace(/[^0-9X]/g, "");
}

function normValue(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function sameValue(left, right) {
  return normValue(left) === normValue(right);
}

function uniqueIndex(rows, keyFn) {
  const map = new Map();
  const duplicates = new Set();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (map.has(key)) duplicates.add(key);
    else map.set(key, row);
  }
  for (const key of duplicates) map.delete(key);
  return { map, duplicates };
}

function countKeys(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function titleAuthorKey(row) {
  const title = normText(row.title);
  const author = normText(row.author);
  if (!title || !author) return null;
  return `ta:${title}|${author}`;
}

function isbnKey(row) {
  const isbn = normIsbn(row.isbn);
  return isbn ? `isbn:${isbn}` : null;
}

async function fetchAll(client) {
  const categories = await client.query(
    "select id, kode, name, color, icon, description from categories order by id"
  );
  const shelves = await client.query(
    "select id, kode, name, location, floor, capacity from shelves order by id"
  );
  const shelfCategories = await client.query("select shelf_id, category_id from shelf_categories");
  const books = await client.query(
    "select id, title, author, category_id, shelf_id, shelf_position, cover, rating, " +
      "published_year, pages, isbn, stock, description, publisher, recommended, created_at " +
      "from books order by id"
  );
  const loanRules = await client.query(
    "select id, type, duration_days, max_renewals, fine_per_day, description, eligibility " +
      "from loan_rules order by id"
  );
  return {
    categories: categories.rows,
    shelves: shelves.rows,
    shelfCategories: shelfCategories.rows,
    books: books.rows,
    loanRules: loanRules.rows,
  };
}

function buildCodeMap(localRows, targetRows) {
  const targetIndex = uniqueIndex(targetRows, (row) => normText(row.kode));
  const idMap = new Map();
  for (const row of localRows) {
    const match = targetIndex.map.get(normText(row.kode));
    idMap.set(row.id, match ? match.id : "NEW");
  }
  return { targetIndex, idMap };
}

async function syncCodeTable(table, fields, localRows, targetRows, idMap) {
  const targetIndex = uniqueIndex(targetRows, (row) => normText(row.kode));
  const result = { inserted: 0, updated: 0, skipped: 0, details: [] };
  const insertSql =
    `insert into ${table} (kode, ${fields.join(", ")}) ` +
    `values ($1, ${fields.map((_, index) => `$${index + 2}`).join(", ")}) returning id`;
  const updateByIdSql =
    `update ${table} set ${fields.map((field, index) => `${field} = $${index + 1}`).join(", ")} ` +
    "where id = $1";

  for (const row of localRows) {
    const existing = targetIndex.map.get(normText(row.kode));
    if (!existing) {
      if (apply) {
        const inserted = await targetClient.query(insertSql, [row.kode, ...fields.map((field) => row[field])]);
        idMap.set(row.id, inserted.rows[0].id);
      }
      result.inserted += 1;
      result.details.push(`+ ${row.kode}`);
      continue;
    }
    idMap.set(row.id, existing.id);
    const changed = fields.filter((field) => !sameValue(row[field], existing[field]));
    if (changed.length === 0) {
      result.skipped += 1;
      continue;
    }
    if (apply) {
      await targetClient.query(updateByIdSql, [existing.id, ...fields.map((field) => row[field])]);
    }
    result.updated += 1;
    result.details.push(`~ ${row.kode} (${changed.join(", ")})`);
  }

  return result;
}

function resolveId(idMap, value, label) {
  if (value === null || value === undefined) return null;
  if (!idMap.has(value)) {
    throw new Error(`${label} id ${value} tidak ditemukan pada data lokal.`);
  }
  return idMap.get(value);
}

async function syncShelfCategories(localData, targetData, categoryMap, shelfMap) {
  const existingPairs = new Set(
    targetData.shelfCategories.map((pair) => `${pair.shelf_id}:${pair.category_id}`)
  );
  const result = { inserted: 0, updated: 0, skipped: 0, details: [] };
  for (const pair of localData.shelfCategories) {
    const shelfId = resolveId(shelfMap, pair.shelf_id, "Rak");
    const categoryId = resolveId(categoryMap, pair.category_id, "Kategori");
    if (shelfId === "NEW" || categoryId === "NEW") {
      result.skipped += 1;
      result.details.push(`? rak ${pair.shelf_id} / kategori ${pair.category_id} (menunggu induk dibuat)`);
      continue;
    }
    if (existingPairs.has(`${shelfId}:${categoryId}`)) {
      result.skipped += 1;
      continue;
    }
    if (!apply) {
      result.inserted += 1;
      result.details.push(`+ rak ${shelfId} / kategori ${categoryId}`);
      continue;
    }
    const inserted = await targetClient.query(
      "insert into shelf_categories (shelf_id, category_id) values ($1, $2) on conflict do nothing",
      [shelfId, categoryId]
    );
    if (inserted.rowCount > 0) {
      result.inserted += 1;
      result.details.push(`+ rak ${shelfId} / kategori ${categoryId}`);
    } else {
      result.skipped += 1;
    }
  }
  return result;
}

async function syncBooks(localData, targetData, categoryMap, shelfMap) {
  const targetByIsbn = uniqueIndex(targetData.books, isbnKey);
  const targetByTitleAuthor = uniqueIndex(targetData.books, titleAuthorKey);
  const localIsbnCounts = countKeys(localData.books, isbnKey);
  const localTitleAuthorCounts = countKeys(localData.books, titleAuthorKey);

  const result = { inserted: 0, updated: 0, skipped: 0, unresolved: 0, details: [] };

  const insertSql =
    `insert into books (${BOOK_FIELDS.join(", ")}, created_at) ` +
    `values (${BOOK_FIELDS.map((_, index) => `$${index + 1}`).join(", ")}, $${BOOK_FIELDS.length + 1}) returning id`;
  const updateSql =
    `update books set ${BOOK_FIELDS.map((field, index) => `${field} = $${index + 1}`).join(", ")} where id = $${
      BOOK_FIELDS.length + 1
    }`;

  for (const book of localData.books) {
    const isbn = isbnKey(book);
    const titleAuthor = titleAuthorKey(book);

    const isbnUnique = Boolean(isbn) && (localIsbnCounts.get(isbn) || 0) === 1;
    const titleAuthorUnique = Boolean(titleAuthor) && (localTitleAuthorCounts.get(titleAuthor) || 0) === 1;

    if (!isbnUnique && !titleAuthorUnique) {
      result.unresolved += 1;
      result.details.push(`! "${book.title}" kunci buku ambigu (ISBN/judul+penulis ganda), dilewati`);
      continue;
    }

    let existing = isbnUnique ? targetByIsbn.map.get(isbn) : null;
    if (!existing && titleAuthorUnique) {
      existing = targetByTitleAuthor.map.get(titleAuthor);
    }

    const categoryId = resolveId(categoryMap, book.category_id, "Kategori");
    const shelfId = resolveId(shelfMap, book.shelf_id, "Rak");
    if (categoryId === "NEW") {
      throw new Error(
        `Buku "${book.title}" memakai kategori lokal yang belum ada di Neon. ` +
          "Sertakan tabel categories dalam sinkronisasi."
      );
    }
    if (shelfId === "NEW") {
      throw new Error(
        `Buku "${book.title}" memakai rak lokal yang belum ada di Neon. ` +
          "Sertakan tabel shelves dalam sinkronisasi."
      );
    }

    const values = BOOK_FIELDS.map((field) => {
      if (field === "category_id") return categoryId;
      if (field === "shelf_id") return shelfId;
      return book[field];
    });

    if (!existing) {
      if (apply) {
        await targetClient.query(insertSql, [...values, book.created_at || new Date()]);
      }
      result.inserted += 1;
      result.details.push(`+ "${book.title}"`);
      continue;
    }

    const changed = [];
    BOOK_FIELDS.forEach((field, index) => {
      if (!sameValue(values[index], existing[field])) changed.push(field);
    });

    if (changed.length === 0) {
      result.skipped += 1;
      continue;
    }

    if (apply) {
      await targetClient.query(updateSql, [...values, existing.id]);
    }
    result.updated += 1;
    result.details.push(`~ "${book.title}" (${changed.join(", ")})`);
  }

  return result;
}

async function syncLoanRules(localData, targetData) {
  const targetIndex = uniqueIndex(targetData.loanRules, (row) => normText(row.type));
  const fields = ["duration_days", "max_renewals", "fine_per_day", "description", "eligibility"];
  const result = { inserted: 0, updated: 0, skipped: 0, details: [] };

  for (const rule of localData.loanRules) {
    const existing = targetIndex.map.get(normText(rule.type));
    if (!existing) {
      if (apply) {
        await targetClient.query(
          `insert into loan_rules (type, ${fields.join(", ")}) ` +
            `values ($1, ${fields.map((_, index) => `$${index + 2}`).join(", ")})`,
          [rule.type, ...fields.map((field) => rule[field])]
        );
      }
      result.inserted += 1;
      result.details.push(`+ ${rule.type}`);
      continue;
    }
    const changed = fields.filter((field) => !sameValue(rule[field], existing[field]));
    if (changed.length === 0) {
      result.skipped += 1;
      continue;
    }
    if (apply) {
      await targetClient.query(
        `update loan_rules set ${fields.map((field, index) => `${field} = $${index + 1}`).join(", ")} where id = $${
          fields.length + 1
        }`,
        [...fields.map((field) => rule[field]), existing.id]
      );
    }
    result.updated += 1;
    result.details.push(`~ ${rule.type} (${changed.join(", ")})`);
  }

  return result;
}

function printSummary(summary) {
  console.log("");
  console.log("Ringkasan");
  for (const [table, result] of Object.entries(summary)) {
    console.log(
      `  ${table.padEnd(16)} insert ${String(result.inserted ?? 0).padStart(2)} | ` +
        `update ${String(result.updated ?? 0).padStart(2)} | ` +
        `skip ${String(result.skipped ?? 0).padStart(2)}`
    );
    if (result.unresolved) {
      console.log(`  ${"".padEnd(16)} dilewati karena kunci ambigu: ${result.unresolved}`);
    }
    for (const detail of result.details) {
      console.log(`    ${detail}`);
    }
  }
  console.log("");
}

async function main() {
  const localClient = new Client(localConfig);
  targetClient = new Client({
    connectionString: parsedUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });

  await localClient.connect();
  await targetClient.connect();

  try {
    const localData = await fetchAll(localClient);
    const targetData = await fetchAll(targetClient);

    if (localData.books.length === 0) {
      throw new Error("Database lokal tidak berisi buku. Sinkronisasi dibatalkan.");
    }

    console.log("Sinkron konten lokal -> Neon");
    console.log(`  sumber : ${localConfig.user}@${localConfig.host}:${localConfig.port}/${localConfig.database}`);
    console.log(`  target : ${parsedUrl.hostname}${parsedUrl.pathname}`);
    console.log(`  mode   : ${apply ? "APPLY (menulis ke Neon)" : "DRY-RUN (tanpa menulis, tambahkan --apply)"}`);
    console.log(`  tabel  : ${selected.join(", ")}`);

    const { idMap: categoryMap } = buildCodeMap(localData.categories, targetData.categories);
    const { idMap: shelfMap } = buildCodeMap(localData.shelves, targetData.shelves);

    const summary = {};

    if (apply) await targetClient.query("BEGIN");
    try {
      if (wants("categories")) {
        summary.categories = await syncCodeTable(
          "categories",
          ["name", "color", "icon", "description"],
          localData.categories,
          targetData.categories,
          categoryMap
        );
      }
      if (wants("shelves")) {
        summary.shelves = await syncCodeTable(
          "shelves",
          ["name", "location", "floor", "capacity"],
          localData.shelves,
          targetData.shelves,
          shelfMap
        );
      }
      if (wants("shelf_categories")) {
        summary.shelf_categories = await syncShelfCategories(
          localData,
          targetData,
          categoryMap,
          shelfMap
        );
      }
      if (wants("books")) {
        summary.books = await syncBooks(localData, targetData, categoryMap, shelfMap);
      }
      if (wants("loan_rules")) {
        summary.loan_rules = await syncLoanRules(localData, targetData);
      }
      if (apply) await targetClient.query("COMMIT");
    } catch (error) {
      if (apply) await targetClient.query("ROLLBACK");
      throw error;
    }

    printSummary(summary);

    if (!apply) {
      console.log("Tidak ada perubahan yang ditulis. Jalankan ulang dengan --apply untuk menerapkan.");
    } else {
      console.log("Sinkronisasi selesai.");
    }
  } finally {
    await localClient.end();
    await targetClient.end();
  }
}

main().catch((error) => {
  console.error(`Sinkronisasi gagal: ${error.message}`);
  process.exit(1);
});
