import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { respond } from "./http.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { booksRouter } from "./routes/books.js";
import { categoriesRouter } from "./routes/categories.js";
import { shelvesRouter } from "./routes/shelves.js";
import { loansRouter } from "./routes/loans.js";
import { ratingsRouter } from "./routes/ratings.js";
import { settingsRouter } from "./routes/settings.js";
import { statsRouter } from "./routes/stats.js";
import { activityRouter } from "./routes/activity.js";
import { migrationRouter } from "./routes/migration.js";

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === "null") return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    respond(res, { success: true, database: "connected", now: result.rows[0].now });
  } catch (error) {
    console.error(error);
    respond(res, { success: false, database: "disconnected" }, 503);
  }
});

app.use("/api", authRouter);
app.use("/api", usersRouter);
app.use("/api", booksRouter);
app.use("/api", categoriesRouter);
app.use("/api", shelvesRouter);
app.use("/api", loansRouter);
app.use("/api", ratingsRouter);
app.use("/api", settingsRouter);
app.use("/api", statsRouter);
app.use("/api", activityRouter);
app.use("/api", migrationRouter);

app.use((_req, res) => {
  respond(res, { success: false, message: "Endpoint tidak ditemukan." }, 404);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof SyntaxError && "body" in error) {
    return respond(res, { success: false, message: "JSON tidak valid." }, 400);
  }
  respond(res, { success: false, message: "Terjadi kesalahan pada server." }, 500);
});

app.listen(port, async () => {
  console.log(`API Perpustakaan berjalan di http://localhost:${port}/api`);
  try {
    const result = await pool.query("SELECT current_database() AS database");
    console.log(`Terhubung ke PostgreSQL: ${result.rows[0].database}`);
  } catch (error) {
    console.error("Gagal terhubung ke PostgreSQL:", error.message);
    console.error("Pastikan PostgreSQL di D:\\postgresql sudah menyala dan .env benar.");
  }
});
