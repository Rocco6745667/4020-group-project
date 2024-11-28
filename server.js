const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const csvParser = require("csv-parser");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || "your-default-mongo-uri";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Mongoose Schema
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: {
    A: String,
    B: String,
    C: String,
    D: String,
  },
  correctAnswer: String,
  chatGPTResponse: { type: String, default: "" },
});

const ComputerSecurity = mongoose.model("ComputerSecurity", QuestionSchema, "computer_security");
const History = mongoose.model("History", QuestionSchema, "history");
const SocialScience = mongoose.model("SocialScience", QuestionSchema, "social_science");

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// API Endpoints
app.post("/api/upload-csv", (req, res) => {
  const filePath = "uploads/data.csv"; // Ensure file is uploaded dynamically
  const records = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (row) => {
      records.push({
        question: row.question,
        options: Object.values(row).slice(1, -1),
        correctAnswer: row.correctAnswer,
        chatGPTResponse: "",
      });
    })
    .on("end", async () => {
      try {
        await ComputerSecurity.insertMany(records); // Adjust as needed
        res.status(201).json({ message: "CSV data uploaded successfully" });
      } catch (err) {
        res.status(500).json({ error: "Failed to save data to MongoDB" });
      }
    })
    .on("error", (error) => res.status(500).json({ error: "Error reading CSV file" }));
});

app.get("/api/chart-data", async (req, res) => {
  try {
    const collections = ["computer_security", "history", "social_science"];
    const stats = {};

    for (const name of collections) {
      const collection = mongoose.connection.collection(name);
      const total = await collection.countDocuments();
      const correct = await collection.countDocuments({
        correctAnswer: { $exists: true, $ne: "" },
        chatGPTResponse: { $expr: { $eq: ["$chatGPTResponse", "$correctAnswer"] } },
      });
      const unanswered = await collection.countDocuments({ chatGPTResponse: "" });
      stats[name] = {
        total,
        correct,
        accuracy: ((correct / total) * 100).toFixed(2),
        unanswered,
      };
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/random-question", async (req, res) => {
  try {
    const collections = [ComputerSecurity, History, SocialScience];
    const randomCollection = collections[Math.floor(Math.random() * collections.length)];
    const count = await randomCollection.countDocuments();
    if (count === 0) return res.status(404).json({ error: "No questions available." });

    const randomIndex = Math.floor(Math.random() * count);
    const question = await randomCollection.findOne().skip(randomIndex);

    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

