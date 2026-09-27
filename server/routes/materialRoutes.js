const express = require("express");
const router = express.Router();
const { protect, teacherOrAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const Material = require("../models/Material");
const cloudinary = require("../config/cloudinary");
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
      fileUrl: req.file.path,
      publicId: req.file.filename,
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
      .populate("topic", "title")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download a material file (any logged-in user)
router.get("/:id/download", protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.redirect(material.fileUrl);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a material (teacher or admin only)
router.delete("/:id", protect, teacherOrAdmin, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    await cloudinary.uploader.destroy(material.publicId, { resource_type: "image" });

    await material.deleteOne();

    res.json({ message: "Material deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   GET /api/materials/search
// @desc    Search materials by title
router.get("/search", protect, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const materials = await Material.find({
      title: { $regex: query, $options: "i" },
    })
      .populate("subject", "name")
      .populate("topic", "title")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;