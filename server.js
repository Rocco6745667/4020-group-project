const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Connect to MongoDB
const mongoURI =
  "mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority"; // Replace with your connection string
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Define a Mongoose schema and model for demonstration
const ExampleSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
});

const Example = mongoose.model("Example", ExampleSchema);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/profiles", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profiles.html"));
});

app.get("/ChatGPT", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "ChatGPT.html"));
});

// API route to interact with MongoDB
app.post("/api/add", async (req, res) => {
  const { name, age, email } = req.body;

  try {
    const newExample = new Example({ name, age, email });
    const savedExample = await newExample.save();
    res.status(201).json(savedExample);
  } catch (error) {
    res.status(500).json({ error: "Failed to save data" });
  }
});

app.get("/api/examples", async (req, res) => {
  try {
    const examples = await Example.find();
    res.status(200).json(examples);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

//require('dotenv').config();
///const mongoURI = process.env.MONGO_URI;
