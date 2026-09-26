const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  question: { type: String, required: true },
  marks: { type: Number, required: false },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New Chat" },
  messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);