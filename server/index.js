require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.get("/", (req, res) => {
  res.send("Exam Prep server is running");
});

app.get("/about", (req, res) => {
  res.send("An app to help students prepare for exams");
});

app.use("/api/subjects", subjectRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});