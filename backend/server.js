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
  process.exit(1);
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
// Healthcheck
// ---------------------

app.get("/health", (req, res) => res.status(200).send("OK"));

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
      SELECT id, artiste, titre, type, status, offres
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
// Init dummy events (pour tester front)
// ---------------------

app.post("/init-events", async (req, res) => {
  try {
    const sampleEvents = [];
    for (let i = 1; i <= 5; i++) {
      const target = 1000000 + i * 1000;
      sampleEvents.push({
        artiste: `Artiste ${i}`,
        titre: `Titre ${i}`,
        type: "stream solo",
        status: "open",
        offres: [
          { label: "-N", cote: 2.0 },
          { label: "interval", cote: 2.5 },
          { label: "+N", cote: 3.0 }
        ],
        targetViews: target,
        intervalUpper: target * 1.01,
        deadline: new Date(Date.now() + 3600 * 1000).toISOString(),
        expectedSpeed: 5000,
        startTime: new Date().toISOString()
      });
    }

    // Insérer dans PostgreSQL (table `events`) si nécessaire
    for (const e of sampleEvents) {
      await pool.query(
        `INSERT INTO events (artiste, titre, type, status, offres, targetviews, intervalupper, deadline, expectedspeed, starttime)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          e.artiste,
          e.titre,
          e.type,
          e.status,
          JSON.stringify(e.offres),
          e.targetViews,
          e.intervalUpper,
          e.deadline,
          e.expectedSpeed,
          e.startTime
        ]
      );
    }

    res.json({ message: "✅ 5 événements initiaux créés", events: sampleEvents });
  } catch (err) {
    console.error("❌ Erreur init-events:", err);
    res.status(500).json({ error: "Impossible de créer les événements" });
  }
});

// ---------------------
// Start server
// ---------------------

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
