const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["notes", "book", "assignment", "question-paper", "diagram"],
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);