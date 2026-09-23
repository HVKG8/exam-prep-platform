const express = require("express");
const router = express.Router();
const Note = require("../models/Note");

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

module.exports = router;