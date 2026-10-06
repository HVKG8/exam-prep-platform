const express = require("express");
const router = express.Router();
const { askGeminiMarkdown, streamGeminiMarkdown } = require("../services/aiService");
const { protect } = require("../middleware/authMiddleware");
const { aiBurstLimiter, aiDailyLimiter } = require("../middleware/aiLimits");
const Question = require("../models/Question");

const MAX_QUESTION_LENGTH = 1000;

// Checks the request and returns { question, marks, history } or { error }
function readInput(req) {
  const question =
    typeof req.body.question === "string" ? req.body.question.trim() : "";

  if (!question) {
    return { error: "Question is required" };
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      error: `Question is too long (maximum ${MAX_QUESTION_LENGTH} characters).`,
    };
  }

  // Marks are optional. If sent, they must be a sensible whole number.
  let marks = null;
  const rawMarks = req.body.marks;
  if (rawMarks !== undefined && rawMarks !== null && rawMarks !== "") {
    marks = Number(rawMarks);
    if (!Number.isInteger(marks) || marks < 1 || marks > 30) {
      return { error: "Marks must be a number from 1 to 30" };
    }
  }

  // Last few chat messages, so follow-up questions make sense
  let history = [];
  if (Array.isArray(req.body.history)) {
    history = req.body.history
      .slice(-4)
      .filter(
        (h) => h && typeof h.question === "string" && typeof h.answer === "string"
      )
      .map((h) => ({
        question: h.question.slice(0, 500),
        answer: h.answer.slice(0, 1500),
      }));
  }

  return { question, marks, history };
}

// Normal route: waits for the full answer (used by Regenerate)
router.post("/solve", protect, aiBurstLimiter, aiDailyLimiter, async (req, res) => {
  try {
    const input = readInput(req);
    if (input.error) {
      return res.status(400).json({ message: input.error });
    }
    const { question, marks, history } = input;

    let answer;
    try {
      answer = await askGeminiMarkdown(question, marks, history);
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

// Streaming route: sends the answer piece by piece while the AI writes it
router.post(
  "/solve-stream",
  protect,
  aiBurstLimiter,
  aiDailyLimiter,
  async (req, res) => {
    const input = readInput(req);
    if (input.error) {
      return res.status(400).json({ message: input.error });
    }
    const { question, marks, history } = input;

    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    let closed = false;
    res.on("close", () => {
      closed = true;
    });

    const send = (data) => {
      if (!closed) res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const answer = await streamGeminiMarkdown(
        question,
        marks,
        history,
        (text) => send({ type: "chunk", text }),
        () => closed
      );

      const saved = await Question.create({
        student: req.user._id,
        question,
        marks,
        answer,
      });

      send({ type: "done", answer: saved.answer });
    } catch (err) {
      console.error("AI stream error:", err.message);
      send({
        type: "error",
        message: "The AI is busy right now. Please try again in a moment.",
      });
    } finally {
      res.end();
    }
  }
);

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