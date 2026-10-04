const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Conversation = require("../models/Conversation");
const { protect } = require("../middleware/authMiddleware");

const MAX_QUESTION_LENGTH = 1000;
const MAX_MESSAGES_PER_CONVERSATION = 200;
const MAX_CONVERSATIONS_PER_STUDENT = 300;
const MAX_ANSWER_SIZE = 50000; // characters, when the answer is written out as text

// Every route that has :id first checks that the id looks valid
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Conversation not found" });
  }
  next();
});

// An AI answer is an object of sections (definition, explanation, ...)
const isValidAnswer = (answer) => {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return false;
  try {
    return JSON.stringify(answer).length <= MAX_ANSWER_SIZE;
  } catch (err) {
    return false;
  }
};

// Marks are optional. If sent, they must be a whole number from 1 to 30.
const cleanMarks = (raw) => {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: undefined };
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 30) return { ok: false };
  return { ok: true, value: n };
};

// POST /api/conversations - create a new conversation
router.post("/", protect, async (req, res) => {
  try {
    const count = await Conversation.countDocuments({ student: req.user._id });
    if (count >= MAX_CONVERSATIONS_PER_STUDENT) {
      return res.status(400).json({
        message: "You have too many chats. Please delete some old ones first.",
      });
    }

    const conversation = await Conversation.create({
      student: req.user._id,
      title: "New Chat",
      messages: [],
    });
    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating conversation" });
  }
});

// POST /api/conversations/:id/messages - add a message to a conversation
router.post("/:id/messages", protect, async (req, res) => {
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

    const marks = cleanMarks(req.body.marks);
    if (!marks.ok) {
      return res.status(400).json({ message: "Marks must be a number from 1 to 30" });
    }

    if (!isValidAnswer(req.body.answer)) {
      return res.status(400).json({ message: "Invalid answer" });
    }

    // Only the owner of the conversation can add to it
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
      return res.status(400).json({
        message: "This chat is full. Please start a new chat.",
      });
    }

    conversation.messages.push({
      question,
      marks: marks.value,
      answer: req.body.answer,
    });

    // if this is the first message, use the question as the title
    if (conversation.messages.length === 1) {
      conversation.title = question.slice(0, 40);
    }

    await conversation.save();
    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error adding message" });
  }
});

// PATCH /api/conversations/:id/messages/:index - replace the answer of one message (Regenerate)
router.patch("/:id/messages/:index", protect, async (req, res) => {
  try {
    const index = Number(req.params.index);

    if (!isValidAnswer(req.body.answer)) {
      return res.status(400).json({ message: "Invalid answer" });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!Number.isInteger(index) || index < 0 || index >= conversation.messages.length) {
      return res.status(400).json({ message: "Invalid message number" });
    }

    conversation.messages[index].answer = req.body.answer;
    conversation.markModified(`messages.${index}.answer`);
    await conversation.save();

    res.status(200).json({ index });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error saving the new answer" });
  }
});

// GET /api/conversations - list conversations for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ student: req.user._id })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(100);

    res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching conversations" });
  }
});

// GET /api/conversations/:id - fetch one conversation with all its messages
router.get("/:id", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching conversation" });
  }
});

// DELETE /api/conversations/:id - delete a conversation
router.delete("/:id", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting conversation" });
  }
});

// PATCH /api/conversations/:id - rename a conversation
router.patch("/:id", protect, async (req, res) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { title: title.slice(0, 100) },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error renaming conversation" });
  }
});

module.exports = router;