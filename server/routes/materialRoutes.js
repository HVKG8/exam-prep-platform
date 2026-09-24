const express = require("express");
const router = express.Router();
const { protect, teacherOrAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const Material = require("../models/Material");

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

module.exports = router;