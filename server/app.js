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

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === "null") return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "15mb" }));

const PHP_ALIASES = new Map([
  ["/api/login", "/api/auth/login.php"],
  ["/api/register", "/api/auth/register.php"],
  ["/api/register-admin", "/api/auth/register-admin.php"],
  ["/api/me", "/api/auth/me.php"],
  ["/api/logout", "/api/auth/logout.php"],
  ["/api/change-password", "/api/auth/change-password.php"],
  ["/api/auth/login", "/api/auth/login.php"],
  ["/api/auth/register", "/api/auth/register.php"],
  ["/api/auth/register-admin", "/api/auth/register-admin.php"],
  ["/api/auth/me", "/api/auth/me.php"],
  ["/api/auth/logout", "/api/auth/logout.php"],
  ["/api/auth/change-password", "/api/auth/change-password.php"],
  ["/api/users", "/api/users/index.php"],
  ["/api/books", "/api/books/index.php"],
  ["/api/categories", "/api/categories/index.php"],
  ["/api/shelves", "/api/shelves/index.php"],
  ["/api/loans", "/api/loans/index.php"],
  ["/api/ratings", "/api/ratings/index.php"],
  ["/api/settings", "/api/settings/index.php"],
  ["/api/loan-rules", "/api/loan-rules/index.php"],
  ["/api/stats", "/api/stats/index.php"],
  ["/api/activity", "/api/activity/index.php"],
  ["/api/migration-local-data", "/api/migration/local-data.php"],
  ["/api/migration/local-data", "/api/migration/local-data.php"],
]);

app.use((req, _res, next) => {
  const [path, query] = req.url.split("?");
  const target = PHP_ALIASES.get(path);
  if (target) req.url = query ? `${target}?${query}` : target;
  next();
});

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

export default app;
