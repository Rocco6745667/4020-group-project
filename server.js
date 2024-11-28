const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// Middleware for parsing JSON
app.use(json());

// Connect to MongoDB
const mongoURI =
  "mongodb+srv://abmbz13:estarossa@cluster0.duuc1.mongodb.net/ChatGPT_Evaluation?retryWrites=true&w=majority"; // Replace with your connection string
connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Define a Mongoose schema and model for demonstration
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

// Models for specific collections
const ComputerSecurity = mongoose.model("ComputerSecurity", QuestionSchema, "computer_security");
const History = mongoose.model("History", QuestionSchema, "history");
const SocialScience = mongoose.model("SocialScience", QuestionSchema, "social_science");

// Serve static files from the "public" directory
app.use(static(join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.get("/profiles", (req, res) => {
  res.sendFile(join(__dirname, "public", "profiles.html"));
});

app.get("/ChatGPT", (req, res) => {
  res.sendFile(join(__dirname, "public", "ChatGPT.html"));
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

app.get("/api/chart-data", async (req, res) => {
  try {
    const collections = ["Computer_Security", "History", "Social_Science"];
    const stats = {};

    for (const collectionName of collections) {
      const collection = connection.collection(collectionName);
      const total = await collection.countDocuments();
      const correct = await collection.countDocuments({
        correctAnswer: { $exists: true, $ne: "" },
        chatGPTResponse: { $eq: "$correctAnswer" },
      });
      const unanswered = await collection.countDocuments({
        chatGPTResponse: { $eq: "" },
      });
      stats[collectionName] = {
        total,
        correct,
        accuracy: ((correct / total) * 100).toFixed(2),
        unanswered,
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

//require('dotenv').config();
///const mongoURI = process.env.MONGO_URI;

// Fetch data from the backend API and populate the charts
async function fetchChartData() {
  try {
    // Fetch the chart data from the backend
    const response = await fetch("/api/chart-data");
    const data = await response.json();

    // Extract data for charts
    const collections = Object.keys(data);
    const totalCounts = collections.map((collection) => data[collection].total);
    const accuracyRates = collections.map(
      (collection) => data[collection].accuracy
    );
    const unansweredCounts = collections.map(
      (collection) => data[collection].unanswered
    );

    // Create Chart 1: Bar Chart for Monthly Usage
    const ctx1 = document.getElementById("chart1").getContext("2d");
    new Chart(ctx1, {
      type: "bar",
      data: {
        labels: collections,
        datasets: [
          {
            label: "Total Questions",
            data: totalCounts,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Total Questions by Category" },
        },
      },
    });

    // Create Chart 2: Line Chart for Performance Trends
    const ctx2 = document.getElementById("chart2").getContext("2d");
    new Chart(ctx2, {
      type: "line",
      data: {
        labels: collections,
        datasets: [
          {
            label: "Accuracy Rate (%)",
            data: accuracyRates,
            borderColor: "rgba(255, 99, 132, 1)",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Accuracy Rate by Category" },
        },
      },
    });

    // Create Chart 3: Pie Chart for Activity Breakdown
    const ctx3 = document.getElementById("chart3").getContext("2d");
    new Chart(ctx3, {
      type: "pie",
      data: {
        labels: collections,
        datasets: [
          {
            data: unansweredCounts,
            backgroundColor: [
              "rgba(255, 206, 86, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 99, 132, 0.2)",
            ],
            borderColor: [
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 99, 132, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Unanswered Questions by Category" },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
  }
}

// Fetch data and render charts on page load
//document.addEventListener("DOMContentLoaded", fetchChartData);

// Define a Mongoose schema for questions
//const QuestionSchema = new mongoose.Schema({
//questionText: String,
//category: String,
//difficulty: String,
//});

//const Question = mongoose.model("Question", QuestionSchema);

// API to fetch a random question
app.get("/api/random-question", async (req, res) => {
  try {
    // Choose a collection randomly
    const collections = [ComputerSecurity, History, SocialScience];
    const randomCollection = collections[Math.floor(Math.random() * collections.length)];

    // Get the total count of documents in the selected collection
    const count = await randomCollection.countDocuments();
    if (count === 0) {
      return res.status(404).json({ error: "No questions available in the selected collection." });
    }

    // Fetch a random document
    const randomIndex = Math.floor(Math.random() * count);
    const question = await randomCollection.findOne().skip(randomIndex);

    res.json(question);
  } catch (error) {
    console.error("Error fetching random question:", error);
    res.status(500).json({ error: "Failed to retrieve random question" });
  }
});


// API to fetch a sequential question
// Track current indices for each collection
let currentIndices = {
  computer_security: 0,
  history: 0,
  social_science: 0,
};

app.get("/api/sequential-question", async (req, res) => {
  try {
    const collections = {
      computer_security: ComputerSecurity,
      history: History,
      social_science: SocialScience,
    };

    // Choose a collection sequentially (for simplicity, always "computer_security" here)
    const collectionName = "computer_security"; // Change dynamically as needed
    const model = collections[collectionName];

    const count = await model.countDocuments();
    if (count === 0) {
      return res.status(404).json({ error: `No questions available in ${collectionName}.` });
    }

    // Fetch the document at the current index
    const question = await model.findOne().skip(currentIndices[collectionName]);

    // Update the index for the collection
    currentIndices[collectionName] = (currentIndices[collectionName] + 1) % count;

    res.json(question);
  } catch (error) {
    console.error("Error fetching sequential question:", error);
    res.status(500).json({ error: "Failed to retrieve sequential question" });
  }
});
