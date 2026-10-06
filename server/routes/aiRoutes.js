const express = require("express");
const router = express.Router();
const { askGeminiMarkdown } = require("../services/aiService");
const { protect } = require("../middleware/authMiddleware");
const { aiBurstLimiter, aiDailyLimiter } = require("../middleware/aiLimits");
const Question = require("../models/Question");

const MAX_QUESTION_LENGTH = 1000;

router.post("/solve", protect, aiBurstLimiter, aiDailyLimiter, async (req, res) => {
  try {
    const question =
      typeof req.body.question === "string" ? req.body.question.trim() : "";

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        message: `Question is too long (maximum ${MAX_QUESTION_LENGTH} characters).`,
      });
    }

    // Marks are optional. If sent, they must be a sensible whole number.
    let marks = null;
    const rawMarks = req.body.marks;
    if (rawMarks !== undefined && rawMarks !== null && rawMarks !== "") {
      marks = Number(rawMarks);
      if (!Number.isInteger(marks) || marks < 1 || marks > 30) {
        return res.status(400).json({ message: "Marks must be a number from 1 to 30" });
      }
    }

    let answer;
    try {
      answer = await askGeminiMarkdown(question, marks);
    } catch (aiError) {
      console.error("AI solve error:", aiError.message);
      return res.status(503).json({
        message: "The AI is busy right now. Please try again in a moment.",
      });
    }

    const saved = await Question.create({
      student: req.user._id,
      question,
      marks,
      answer,
    });

    res.json(saved);
  } catch (error) {
    console.error("Solve route error:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

router.get("/history", protect, async (req, res) => {
  try {
    const history = await Question.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (error) {
    console.error("History route error:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

module.exports = router;