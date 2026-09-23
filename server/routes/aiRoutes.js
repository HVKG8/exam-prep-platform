const express = require("express");
const router = express.Router();
const { askGemini } = require("../services/aiService");
const { protect } = require("../middleware/authMiddleware");
const Question = require("../models/Question");

router.post("/solve", protect, async (req, res) => {
  try {
    const { question, marks } = req.body;

    if (!question || !marks) {
      return res.status(400).json({ message: "Question and marks are required" });
    }

    const answer = await askGemini(question, marks);

    const saved = await Question.create({
      student: req.user._id,
      question,
      marks,
      answer,
    });

    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: "AI request failed", error: error.message });
  }
});

module.exports = router;