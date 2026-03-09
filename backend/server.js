// server.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // PostgreSQL
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Railway définit le port automatiquement
const PORT = process.env.PORT || 3000;

// Configuration PostgreSQL via variables Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // nécessaire pour Railway
});

// --------------------
// Healthcheck pour Railway
// --------------------
app.get("/health", (req, res) => res.status(200).send("OK"));

// --------------------
// Route racine (optionnel)
// --------------------
app.get("/", (req, res) => {
  res.send("API Musical Market fonctionne !");
});

// --------------------
// Route pour récupérer tous les événements ouverts
// --------------------
app.get("/events", async (req, res) => {
  try {
    // Récupère tous les événements ouverts
    const result = await pool.query(
      "SELECT id, artiste, titre, type, status, offres FROM events WHERE status='open'"
    );
    // Retourne sous forme JSON
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération events:", err);
    res.status(500).json({ error: "Impossible de récupérer les events" });
  }
});

// --------------------
// Start server
// --------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
