const mongoose = require("mongoose");

// The AI's feedback for one answer
const feedbackSchema = new mongoose.Schema(
  {
    wentWell: { type: String, default: "" },
    toAdd: { type: [String], default: [] },
    betterAnswer: { type: String, default: "" },
    followUp: { type: String, default: "" },
    readiness: {
      type: String,
      enum: ["needs_practice", "getting_there", "strong"],
      default: "getting_there",
    },
  },
  { _id: false }
);

// One viva question with the student's answer(s)
const vivaItemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  attempts: { type: Number, default: 0 },
  feedback: { type: feedbackSchema, default: null },
  followUpAnswer: { type: String, default: "" },
  followUpFeedback: { type: feedbackSchema, default: null },
});

const vivaSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, default: "", trim: true },
    items: { type: [vivaItemSchema], default: [] },
    status: {
      type: String,
      enum: ["in_progress", "finished"],
      default: "in_progress",
    },
    readiness: {
      type: String,
      enum: ["needs_practice", "getting_there", "strong"],
      default: "getting_there",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VivaSession", vivaSessionSchema);