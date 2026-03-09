const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Healthcheck
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Route racine
app.get("/", (req, res) => {
  res.send("API Musical Market fonctionne !");
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Route pour récupérer les chansons
app.get("/songs", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, title, artist FROM songs");
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur récupération chansons :", error);
    res.status(500).json({ error: "Impossible de récupérer les chansons" });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
