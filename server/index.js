require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const subjectRoutes = require("./routes/subjectRoutes");
const authRoutes = require("./routes/authRoutes");
const topicRoutes = require("./routes/topicRoutes");
const noteRoutes = require("./routes/noteRoutes");
const materialRoutes = require("./routes/materialRoutes");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Exam Prep server is running");
});

app.get("/about", (req, res) => {
  res.send("An app to help students prepare for exams");
});

app.use("/api/subjects", subjectRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/materials", materialRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});