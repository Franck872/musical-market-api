// server.js

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "OK" : "MANQUANT");

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ---------------------
// PostgreSQL connection
// ---------------------

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL manquant !");
  process.exit(1); // stop le serveur si pas de DB
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ---------------------
// Test connexion DB au démarrage
// ---------------------

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connexion PostgreSQL OK");
    client.release();
  } catch (err) {
    console.error("❌ Erreur connexion PostgreSQL:", err);
  }
})();

// ---------------------
// Healthcheck Railway
// ---------------------

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ---------------------
// Route racine
// ---------------------

app.get("/", (req, res) => {
  res.json({ message: "API Musical Market active" });
});

// ---------------------
// Test DB
// ---------------------

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ db_time: result.rows[0] });
  } catch (error) {
    console.error("❌ DB error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ---------------------
// Events
// ---------------------

app.get("/events", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        artiste,
        titre,
        type,
        status,
        offres
      FROM events
      WHERE status = 'open'
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Erreur récupération events:", error);
    res.status(500).json({ error: "Impossible de récupérer les événements" });
  }
});

// ---------------------
// Start server
// ---------------------

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
