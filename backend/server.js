const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Route healthcheck
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("API Musical Market fonctionne !");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
