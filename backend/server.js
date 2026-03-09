const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// PORT dynamique fourni par Railway
const PORT = process.env.PORT || 3000;

// ------------------
// CONFIG POSTGRESQL
// ------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Railway fournit DATABASE_URL
  ssl: { rejectUnauthorized: false }          // nécessaire pour Railway
});

// ------------------
// ROUTES
// ------------------

// Healthcheck pour Railway
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Route test principale
app.get("/", (req, res) => {
  res.send("API Musical Market fonctionne !");
});

// Route pour récupérer toutes les chansons depuis PostgreSQL
app.get("/songs", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, title, artist FROM songs");
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération chansons :", error);
    res.status(500).json({ error: "Impossible de récupérer les chansons" });
  }
});

// ------------------
// START SERVER
// ------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
