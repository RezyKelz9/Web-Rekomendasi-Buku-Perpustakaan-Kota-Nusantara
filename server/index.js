import "dotenv/config";
import app from "./app.js";
import { pool } from "./db.js";

const port = Number(process.env.PORT || process.env.API_PORT || 3001);

app.listen(port, async () => {
  console.log(`API Perpustakaan berjalan di http://localhost:${port}/api`);
  try {
    const result = await pool.query("SELECT current_database() AS database");
    console.log(`Terhubung ke PostgreSQL: ${result.rows[0].database}`);
  } catch (error) {
    console.error("Gagal terhubung ke PostgreSQL:", error.message);
    console.error("Pastikan PostgreSQL menyala dan konfigurasi .env benar.");
  }
});
