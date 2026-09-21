const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Exam Prep server is running");
});

app.get("/about", (req, res) => {
  res.send("An app to help students prepare for exams");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});