const rateLimit = require("express-rate-limit");

// Change these two numbers if you want stricter or looser limits
const MAX_PER_MINUTE = 2;
const MAX_PER_DAY = 60;

// Counts per logged-in student, not per IP, because many students share
// one college WiFi address. Always use this AFTER the protect middleware.
const perStudent = (req) => String(req.user._id);

const aiBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: MAX_PER_MINUTE,
  keyGenerator: perStudent,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "You are going too fast. Please wait a minute and try again.",
  },
});

const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: MAX_PER_DAY,
  keyGenerator: perStudent,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: `You have used all ${MAX_PER_DAY} AI requests for today. Please come back tomorrow.`,
  },
});

module.exports = { aiBurstLimiter, aiDailyLimiter };