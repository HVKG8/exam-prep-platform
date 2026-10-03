const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: false }, // empty for Google-only accounts
    googleId: { type: String },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },

    // ----- Email verification (6-digit code) -----
    emailVerified: { type: Boolean, default: false },
    verifyTokenHash: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    verifyEmailSentAt: { type: Date },
    verifyAttempts: { type: Number, default: 0 },

    // ----- Forgot password (6-digit code) -----
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    resetEmailSentAt: { type: Date },
    resetAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);