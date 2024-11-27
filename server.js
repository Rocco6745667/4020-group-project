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

// Fetch data from the backend API and populate the charts
async function fetchChartData() {
  try {
    // Fetch the chart data from the backend
    const response = await fetch("/api/chart-data");
    const data = await response.json();

    // Extract data for charts
    const months = data.map((item) => item.month);
    const usageHours = data.map((item) => item.usageHours);
    const performanceScores = data.map((item) => item.performanceScore);
    const activityBreakdown = data.map((item) => item.activityBreakdown);

    const training = activityBreakdown.map((item) => item.training);
    const testing = activityBreakdown.map((item) => item.testing);
    const idle = activityBreakdown.map((item) => item.idle);

    // Create Chart 1: Bar Chart for Monthly Usage
    const ctx1 = document.getElementById("chart1").getContext("2d");
    new Chart(ctx1, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Monthly Usage (hrs)",
            data: usageHours,
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
          title: { display: true, text: "Monthly Usage" },
        },
      },
    });

    // Create Chart 2: Line Chart for Performance Trends
    const ctx2 = document.getElementById("chart2").getContext("2d");
    new Chart(ctx2, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Performance Score",
            data: performanceScores,
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
          title: { display: true, text: "Performance Trends" },
        },
      },
    });

    // Create Chart 3: Pie Chart for Activity Breakdown
    const ctx3 = document.getElementById("chart3").getContext("2d");
    new Chart(ctx3, {
      type: "pie",
      data: {
        labels: ["Training", "Testing", "Idle"],
        datasets: [
          {
            data: [
              training.reduce((a, b) => a + b, 0),
              testing.reduce((a, b) => a + b, 0),
              idle.reduce((a, b) => a + b, 0),
            ],
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
          title: { display: true, text: "Activity Breakdown" },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
  }
}

// Fetch data and render charts on page load
document.addEventListener("DOMContentLoaded", fetchChartData);
