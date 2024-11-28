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
const QuestionSchema = new Schema({
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

const Question = model("Question", QuestionSchema);

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
    const count = await Question.countDocuments(); // Get total number of questions
    const randomIndex = Math.floor(Math.random() * count); // Pick a random index
    const question = await Question.findOne().skip(randomIndex); // Skip to that index
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve question" });
  }
});

// API to fetch a sequential question
let currentQuestionIndex = 0;
app.get("/api/sequential-question", async (req, res) => {
  try {
    const count = await Question.countDocuments(); // Get total number of questions
    const question = await Question.findOne().skip(currentQuestionIndex); // Skip to the current index
    currentQuestionIndex = (currentQuestionIndex + 1) % count; // Move to the next question
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve question" });
  }
});
