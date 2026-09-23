const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const { protect, teacherOrAdmin } = require("../middleware/authMiddleware");

// GET all notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find().populate("topic");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET notes for a specific topic
router.get("/topic/:topicId", async (req, res) => {
  try {
    const notes = await Note.find({ topic: req.params.topicId }).populate("topic");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a note (teacher/admin only)
router.post("/", protect, teacherOrAdmin, async (req, res) => {
  try {
    const { title, topic, content } = req.body;
    const note = await Note.create({ title, topic, content });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update a note (teacher/admin only)
router.put("/:id", protect, teacherOrAdmin, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a note (teacher/admin only)
router.delete("/:id", protect, teacherOrAdmin, async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;