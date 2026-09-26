const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/aiService");
const { protect } = require("../middleware/authMiddleware");
const Question = require("../models/Question");

router.post("/solve", protect, async (req, res) => {
  try {
    const { question, marks } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const answer = await askGemini(question, marks || null);

    const saved = await Question.create({
      student: req.user._id,
      question,
      marks: marks || null,
      answer,
    });

    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: "AI request failed", error: error.message });
  }
});
router.get("/history", protect, async (req, res) => {
  try {
    const history = await Question.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
});

module.exports = router;