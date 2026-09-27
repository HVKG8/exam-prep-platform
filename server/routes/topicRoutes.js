const express = require("express");
const Topic = require("../models/Topic");
const Subject = require("../models/Subject");
const { protect, teacherOrAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  const topics = await Topic.find().populate("subject");
  res.json(topics);
});

// NEW: create a topic (teacher/admin only)
router.post("/", protect, teacherOrAdmin, async (req, res) => {
  try {
    const { title, subject } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ message: "Title and subject are required" });
    }

    const existing = await Topic.findOne({ title, subject });
    if (existing) {
      return res.status(400).json({ message: "This topic already exists for that subject" });
    }

    const topic = await Topic.create({ title, subject });
    const populated = await topic.populate("subject");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create topic" });
  }
});

module.exports = router;