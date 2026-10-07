require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const subjectRoutes = require("./routes/subjectRoutes");
const authRoutes = require("./routes/authRoutes");
const topicRoutes = require("./routes/topicRoutes");
const noteRoutes = require("./routes/noteRoutes");
const materialRoutes = require("./routes/materialRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Only these websites may call the API from a browser.
// To allow another one later, add it to EXTRA_ORIGINS (comma separated) on Render.
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://examprep-ai-kappa.vercel.app",
  ...(process.env.EXTRA_ORIGINS
    ? process.env.EXTRA_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = Postman, a monitoring ping, or a direct visit. Allowed.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Exam Prep server is running");
});

app.get('/health', (req, res) => {
  res.status(200).send('ok');
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
app.use("/api/conversations", conversationRoutes);
app.use("/api/viva", require("./routes/vivaRoutes"));
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid request data" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large" });
  }
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});