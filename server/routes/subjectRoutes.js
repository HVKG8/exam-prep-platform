const express = require("express");
const router = express.Router();
const { protect, teacherOrAdmin } = require("../middleware/authMiddleware");
const Subject = require("../models/Subject");
const Branch = require("../models/Branch");

router.get("/", async (req, res) => {
  const subjects = await Subject.find().populate("branch");
  res.json(subjects);
});

// NEW: create a subject (teacher/admin only)
router.post("/", protect, teacherOrAdmin, async (req, res) => {
  try {
    const { name, semester } = req.body;
    if (!name || !semester) {
      return res.status(400).json({ message: "Name and semester are required" });
    }

    const existing = await Subject.findOne({ name, semester });
    if (existing) {
      return res.status(400).json({ message: "This subject already exists for that semester" });
    }

    const branch = await Branch.findOne();
    if (!branch) {
      return res.status(400).json({ message: "No branch found. Run seed.js first." });
    }

    const subject = await Subject.create({ name, semester, branch: branch._id });
    const populated = await subject.populate("branch");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create subject" });
  }
});

module.exports = router;