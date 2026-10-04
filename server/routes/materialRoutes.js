const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const Material = require("../models/Material");
const cloudinary = require("../config/cloudinary");
require("../models/Subject");

// Word and PowerPoint files are stored by Cloudinary as "raw" files,
// PDFs and images as "image" files. Deleting needs the right kind.
const RAW_EXTENSIONS = [".doc", ".docx", ".ppt", ".pptx"];
const cloudinaryKind = (fileName) =>
  RAW_EXTENSIONS.includes(path.extname(fileName || "").toLowerCase()) ? "raw" : "image";

// Best-effort cleanup of an uploaded file (never throws)
const removeFromCloudinary = async (publicId, fileName) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: cloudinaryKind(fileName),
    });
  } catch (err) {
    console.error("Cloudinary cleanup failed:", err.message);
  }
};

// Runs the upload and turns its errors into clear JSON messages
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File is too large. The maximum size is 10 MB." });
      }
      return res
        .status(400)
        .json({ message: "Upload failed. Please check the file and try again." });
    }

    if (err.message === "File type not allowed") {
      return res.status(400).json({
        message: "File type not allowed. Use PDF, Word, PowerPoint, PNG or JPG.",
      });
    }

    console.error("Upload error:", err);
    res.status(502).json({ message: "Could not upload the file. Please try again." });
  });
};

// Upload a new material (admin only)
router.post("/", protect, adminOnly, handleUpload, async (req, res) => {
  // If anything is wrong, the file is already in Cloudinary, so remove it again
  const fail = async (status, message) => {
    if (req.file) await removeFromCloudinary(req.file.filename, req.file.originalname);
    return res.status(status).json({ message });
  };

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const { type, subject, topic } = req.body;

    if (!title || title.length > 150) {
      return fail(400, "Title is required and must be at most 150 characters");
    }
    if (!mongoose.isValidObjectId(subject)) {
      return fail(400, "Please choose a valid subject");
    }
    if (topic && !mongoose.isValidObjectId(topic)) {
      return fail(400, "Please choose a valid topic");
    }

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
    if (err.name === "ValidationError" || err.name === "CastError") {
      return fail(400, "Please check the title, type and subject and try again.");
    }
    console.error("Material upload error:", err);
    return fail(500, "Something went wrong. Please try again.");
  }
});

// Search materials by title (any logged-in user)
router.get("/search", protect, async (req, res) => {
  try {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    if (query.length > 100) {
      return res.status(400).json({ message: "Search text is too long" });
    }

    // Treat the text as plain words, not as a pattern
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const materials = await Material.find({
      title: { $regex: safeQuery, $options: "i" },
    })
      .populate("subject", "name")
      .populate("topic", "title")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (err) {
    console.error("Material search error:", err);
    res.status(500).json({ message: "Search failed. Please try again." });
  }
});

// List materials (any logged-in user), with optional filters
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};

    if (typeof req.query.subject === "string" && req.query.subject) {
      if (!mongoose.isValidObjectId(req.query.subject)) {
        return res.status(400).json({ message: "Invalid subject" });
      }
      filter.subject = req.query.subject;
    }
    if (typeof req.query.type === "string" && req.query.type) {
      filter.type = req.query.type;
    }

    const materials = await Material.find(filter)
      .populate("subject", "name")
      .populate("topic", "title")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (err) {
    console.error("Material list error:", err);
    res.status(500).json({ message: "Could not load materials. Please try again." });
  }
});

// Download a material file (any logged-in user)
router.get("/:id/download", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Material not found" });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.redirect(material.fileUrl);
  } catch (err) {
    console.error("Material download error:", err);
    res.status(500).json({ message: "Could not open the file. Please try again." });
  }
});

// Delete a material (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Material not found" });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Remove the file first. If that fails, keep the record so the admin can retry.
    try {
      await cloudinary.uploader.destroy(material.publicId, {
        resource_type: cloudinaryKind(material.fileName),
      });
    } catch (cloudErr) {
      console.error("Cloudinary delete failed:", cloudErr.message);
      return res.status(502).json({
        message: "Could not delete the file from storage. Please try again.",
      });
    }

    await material.deleteOne();

    res.json({ message: "Material deleted" });
  } catch (err) {
    console.error("Material delete error:", err);
    res.status(500).json({ message: "Could not delete the material. Please try again." });
  }
});

module.exports = router;