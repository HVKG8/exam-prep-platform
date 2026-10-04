const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // Keep only safe characters so a file name cannot create folders or break the URL
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100);

    return {
      folder: "exam-prep-materials",
      public_id: Date.now() + "-" + safeName,
      resource_type: "auto", // lets Cloudinary handle PDFs/docs, not just images
    };
  },
});

const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

module.exports = upload;