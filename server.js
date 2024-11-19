const express = require("express");
const path = require("path");
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route to serve profiles.html
app.get("/profiles", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profiles.html"));
});

// Route to serve ChatGPT.html
app.get("/ChatGPT", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "ChatGPT.html"));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
