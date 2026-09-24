const express = require("express");
const router = express.Router();
const { protect, teacherOrAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const Material = require("../models/Material");
require("../models/Subject");

// Upload a new material (teacher or admin only)
router.post("/", protect, teacherOrAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, type, subject, topic } = req.body;

    const material = await Material.create({
      title,
      type,
      subject,
      topic: topic || undefined,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });

    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List materials (any logged-in user), with optional filters
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.type) filter.type = req.query.type;

    const materials = await Material.find(filter)
      .populate("subject", "name")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;