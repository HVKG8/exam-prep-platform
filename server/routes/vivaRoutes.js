const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { generateVivaQuestions, evaluateVivaAnswer } = require("../services/aiService");
const { protect } = require("../middleware/authMiddleware");
const VivaSession = require("../models/VivaSession");

// Start a viva: the AI writes 5 questions and a new session is saved.
router.post("/start", protect, async (req, res) => {
  try {
    const subject = (req.body.subject || "").trim();
    const topic = (req.body.topic || "").trim();

    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }

    let questions;
    try {
      questions = await generateVivaQuestions(subject, topic, 5);
    } catch (aiError) {
      console.error("Viva start AI error:", aiError.message);
      return res.status(503).json({
        message: "The AI examiner is busy right now. Please try again in a moment.",
      });
    }

    const session = await VivaSession.create({
      student: req.user._id,
      subject,
      topic,
      items: questions.map((q) => ({ question: q })),
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to start viva", error: error.message });
  }
});

// List my past sessions (short info only, newest first).
router.get("/", protect, async (req, res) => {
  try {
    const sessions = await VivaSession.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("subject topic status readiness createdAt items.answer")
      .lean();

    const list = sessions.map((s) => ({
      _id: s._id,
      subject: s.subject,
      topic: s.topic,
      status: s.status,
      readiness: s.readiness,
      createdAt: s.createdAt,
      totalQuestions: s.items.length,
      answeredCount: s.items.filter((i) => i.answer).length,
    }));

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch viva sessions", error: error.message });
  }
});

// Get one full session.
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Viva session not found" });
    }

    const session = await VivaSession.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: "Viva session not found" });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch viva session", error: error.message });
  }
});

// Send one spoken answer (or follow-up answer) and get feedback.
router.post("/:id/answer", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Viva session not found" });
    }

    const { itemIndex, isFollowUp } = req.body;
    const answer = (req.body.answer || "").trim();

    if (!answer) {
      return res.status(400).json({ message: "Answer is required" });
    }
    if (answer.length > 3000) {
      return res.status(400).json({ message: "Answer is too long" });
    }

    // only the student who owns the session can use it
    const session = await VivaSession.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: "Viva session not found" });
    }

    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= session.items.length) {
      return res.status(400).json({ message: "Invalid question number" });
    }

    const item = session.items[itemIndex];

    // follow-up answers only make sense after the main answer got feedback
    if (isFollowUp && !(item.feedback && item.feedback.followUp)) {
      return res.status(400).json({ message: "There is no follow-up question yet" });
    }

    const questionText = isFollowUp ? item.feedback.followUp : item.question;

    let feedback;
    try {
      feedback = await evaluateVivaAnswer(
        questionText,
        answer,
        session.subject,
        session.topic
      );
    } catch (aiError) {
      console.error("Viva answer AI error:", aiError.message);
      return res.status(503).json({
        message: "The AI examiner is busy right now. Your answer is safe, please try again.",
      });
    }

    if (isFollowUp) {
      item.followUpAnswer = answer;
      item.followUpFeedback = feedback;
    } else {
      item.answer = answer;
      item.attempts = (item.attempts || 0) + 1;
      item.feedback = feedback;
    }

    await session.save();

    res.json({ itemIndex, isFollowUp: !!isFollowUp, feedback, attempts: item.attempts });
  } catch (error) {
    res.status(500).json({ message: "Failed to evaluate answer", error: error.message });
  }
});

// Finish the session: work out the overall readiness (no AI call needed).
router.post("/:id/finish", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Viva session not found" });
    }

    const session = await VivaSession.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: "Viva session not found" });
    }

    const points = { needs_practice: 0, getting_there: 1, strong: 2 };
    const scores = session.items
      .filter((i) => i.feedback && i.feedback.readiness)
      .map((i) => points[i.feedback.readiness]);

    if (scores.length === 0) {
      return res.status(400).json({ message: "Answer at least one question first" });
    }

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (average < 0.75) session.readiness = "needs_practice";
    else if (average < 1.5) session.readiness = "getting_there";
    else session.readiness = "strong";

    session.status = "finished";
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to finish viva", error: error.message });
  }
});

module.exports = router;