const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const { protect } = require("../middleware/authMiddleware");

// POST /api/conversations - create a new conversation
router.post("/", protect, async (req, res) => {
  try {
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
    const { question, marks, answer } = req.body;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    conversation.messages.push({ question, marks, answer });

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

// GET /api/conversations - list all conversations for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ student: req.user._id })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 });

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
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { title: title.trim() },
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