const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dns = require("dns").promises;
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { protect } = require("../middleware/authMiddleware");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
 
const router = express.Router();
 
const CODE_MINUTES = 10; // how long a code works
const MAX_ATTEMPTS = 5; // wrong guesses allowed per code
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between emails
 
const GOOGLE_ONLY_MESSAGE =
  "This account uses Google sign-in. Use Continue with Google, or tap Forgot password to set a password.";
 
// ---------- Rate limits (per IP) ----------
// Limits are generous because many students share one college WiFi address.
 
// Login and code checks: only FAILED tries count, so normal use is never blocked
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});
 
// Routes that send an email
const mailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
 
// ---------- Helpers ----------
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
 
// Same response shape for login, verify, reset and google
const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});
 
// Keyed hash: a leaked database alone cannot be used to guess the codes.
// "purpose" makes a verification code useless for a password reset.
const hashCode = (purpose, email, code) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${purpose}:${String(email).toLowerCase()}:${code}`)
    .digest("hex");
 
const codeMatches = (storedHash, purpose, email, code) => {
  const expected = Buffer.from(storedHash, "hex");
  const given = Buffer.from(hashCode(purpose, email, code), "hex");
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};
 
const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
 
const newCode = () => crypto.randomInt(100000, 1000000).toString();
 
// ---------- Email checks (used on sign up only) ----------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
 
// Common typos -> the domain people meant
const TYPO_DOMAINS = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.comm": "gmail.com",
  "yahho.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
};
 
// Does this domain have a mail server at all?
const domainCanReceiveMail = async (domain) => {
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") return false;
    return true; // DNS problem on our side: do not block the student
  }
};
 
// Returns a message if the email is bad, or null if it looks fine
const checkEmail = async (email) => {
  if (email.length > 254 || !EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address.";
  }
 
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
 
  if (TYPO_DOMAINS[domain]) {
    return `Did you mean ${local}@${TYPO_DOMAINS[domain]}?`;
  }
 
  if (!(await domainCanReceiveMail(domain))) {
    return "This email domain does not look real. Please check for typos.";
  }
 
  return null;
};
 
const attachVerifyCode = (user) => {
  const code = newCode();
  user.verifyTokenHash = hashCode("verify", user.email, code);
  user.verifyTokenExpires = new Date(Date.now() + CODE_MINUTES * 60 * 1000);
  user.verifyEmailSentAt = new Date();
  user.verifyAttempts = 0;
  return code;
};
 
const attachResetCode = (user) => {
  const code = newCode();
  user.resetTokenHash = hashCode("reset", user.email, code);
  user.resetTokenExpires = new Date(Date.now() + CODE_MINUTES * 60 * 1000);
  user.resetEmailSentAt = new Date();
  user.resetAttempts = 0;
  return code;
};
 
const sendCodeEmail = async (user, code, subject, intro) => {
  await sendEmail({
    to: user.email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#4f46e5">🎓 ExamPrep AI</h2>
        <p>Hi ${escapeHtml(user.name)},</p>
        <p>${intro}</p>
        <p style="margin:24px 0;font-size:34px;font-weight:bold;letter-spacing:10px;color:#111827">
          ${code}
        </p>
        <p style="font-size:13px;color:#555">
          This code works for ${CODE_MINUTES} minutes. Do not share it with anyone.
        </p>
        <p style="font-size:13px;color:#555">
          If this was not you, you can ignore this email.
        </p>
      </div>
    `,
  });
};
 
const sendVerificationEmail = async (user, code) => {
  try {
    await sendCodeEmail(
      user,
      code,
      `${code} is your ExamPrep AI verification code`,
      "Use this code to verify your email address:"
    );
  } catch (err) {
    // If the email never left, do not keep the cooldown
    user.verifyEmailSentAt = undefined;
    await user.save().catch(() => {});
    throw err;
  }
};
 
const sendResetEmail = async (user, code) => {
  try {
    await sendCodeEmail(
      user,
      code,
      `${code} is your ExamPrep AI password reset code`,
      "Use this code to reset your password:"
    );
  } catch (err) {
    // If the email never left, do not keep the cooldown
    user.resetEmailSentAt = undefined;
    await user.save().catch(() => {});
    throw err;
  }
};
 
const onCooldown = (sentAt) =>
  sentAt && Date.now() - new Date(sentAt).getTime() < RESEND_COOLDOWN_MS;
 
// ---------- REGISTER ----------
router.post("/register", mailLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
 
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
 
    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
 
    const cleanEmail = String(email).trim();
    const cleanName = String(name).trim();
 
    // Stop bad or mistyped emails before anything is saved or emailed
    const emailProblem = await checkEmail(cleanEmail);
    if (emailProblem) {
      return res.status(400).json({ message: emailProblem });
    }
 
    let user = await User.findOne({ email: cleanEmail });
 
    if (user && user.emailVerified) {
      if (!user.passwordHash) {
        return res.status(400).json({ message: GOOGLE_ONLY_MESSAGE });
      }
      return res
        .status(400)
        .json({ message: "This email is already registered" });
    }
 
    // Unverified account with this email: the real owner may take it over
    if (user && onCooldown(user.verifyEmailSentAt)) {
      return res.status(429).json({
        message: "A code was just sent. Please wait a minute and try again.",
      });
    }
 
    const passwordHash = await bcrypt.hash(password, 10);
 
    if (user) {
      user.name = cleanName;
      user.passwordHash = passwordHash;
    } else {
      user = new User({
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        emailVerified: false,
      });
    }
 
    const code = attachVerifyCode(user);
    await user.save();
 
    let emailSent = true;
    try {
      await sendVerificationEmail(user, code);
    } catch (mailErr) {
      console.error(mailErr);
      emailSent = false;
    }
 
    res.json({
      needsVerification: true,
      email: user.email,
      emailSent,
      message: emailSent
        ? "Account created. Enter the code we emailed you."
        : "Account created, but we could not send the email. Please use Resend.",
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "This email is already registered" });
    }
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});
 
// ---------- VERIFY EMAIL (6-digit code) ----------
router.post("/verify-email", authLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
 
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }
 
    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({ message: "Enter the 6-digit code" });
    }
 
    const user = await User.findOne({ email: String(email).trim() }).select(
      "+verifyTokenHash +verifyTokenExpires"
    );
 
    const invalid = {
      message: "This code is incorrect or has expired. Please request a new one.",
    };
 
    if (
      !user ||
      user.emailVerified ||
      !user.verifyTokenHash ||
      !user.verifyTokenExpires ||
      user.verifyTokenExpires < new Date()
    ) {
      return res.status(400).json(invalid);
    }
 
    if ((user.verifyAttempts || 0) >= MAX_ATTEMPTS) {
      return res.status(429).json({
        message: "Too many wrong attempts. Please request a new code.",
      });
    }
 
    if (!codeMatches(user.verifyTokenHash, "verify", user.email, cleanCode)) {
      user.verifyAttempts = (user.verifyAttempts || 0) + 1;
      await user.save();
      const left = MAX_ATTEMPTS - user.verifyAttempts;
      return res.status(400).json({
        message:
          left > 0
            ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
            : "Too many wrong attempts. Please request a new code.",
      });
    }
 
    user.emailVerified = true;
    user.verifyTokenHash = undefined;
    user.verifyTokenExpires = undefined;
    user.verifyAttempts = 0;
    await user.save();
 
    // Verifying also logs the person in
    res.json(userResponse(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
});
 
// ---------- RESEND VERIFICATION CODE ----------
router.post("/resend-verification", mailLimiter, async (req, res) => {
  try {
    const { email } = req.body;
 
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
 
    // Same answer whether or not the account exists
    const genericOk = {
      message:
        "If this email has an unverified account, a new code has been sent.",
    };
 
    const user = await User.findOne({ email: String(email).trim() });
 
    if (
      !user ||
      user.emailVerified ||
      !user.passwordHash ||
      onCooldown(user.verifyEmailSentAt)
    ) {
      return res.json(genericOk);
    }
 
    const code = attachVerifyCode(user);
    await user.save();
    await sendVerificationEmail(user, code);
 
    res.json(genericOk);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Could not send the email. Please try again later." });
  }
});
 
// ---------- FORGOT PASSWORD (sends a code) ----------
router.post("/forgot-password", mailLimiter, async (req, res) => {
  try {
    const { email } = req.body;
 
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
 
    // Same answer whether or not the account exists
    const genericOk = {
      message:
        "If an account with this email exists, we sent a 6-digit code to it.",
    };
 
    const user = await User.findOne({ email: String(email).trim() });
 
    // Only verified accounts can reset. Google accounts use this
    // to set a password for the first time.
    if (!user || !user.emailVerified || onCooldown(user.resetEmailSentAt)) {
      return res.json(genericOk);
    }
 
    const code = attachResetCode(user);
    await user.save();
    await sendResetEmail(user, code);
 
    res.json(genericOk);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Could not send the email. Please try again later." });
  }
});
 
// ---------- RESET PASSWORD (checks the code, sets the new password) ----------
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
 
    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code and new password are required" });
    }
 
    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({ message: "Enter the 6-digit code" });
    }
 
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
 
    const user = await User.findOne({ email: String(email).trim() }).select(
      "+resetTokenHash +resetTokenExpires"
    );
 
    const invalid = {
      message: "This code is incorrect or has expired. Please request a new one.",
    };
 
    if (
      !user ||
      !user.resetTokenHash ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < new Date()
    ) {
      return res.status(400).json(invalid);
    }
 
    if ((user.resetAttempts || 0) >= MAX_ATTEMPTS) {
      return res.status(429).json({
        message: "Too many wrong attempts. Please request a new code.",
      });
    }
 
    if (!codeMatches(user.resetTokenHash, "reset", user.email, cleanCode)) {
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      await user.save();
      const left = MAX_ATTEMPTS - user.resetAttempts;
      return res.status(400).json({
        message:
          left > 0
            ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
            : "Too many wrong attempts. Please request a new code.",
      });
    }
 
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.resetAttempts = 0;
    await user.save();
 
    // They proved they own the email, so sign them in
    res.json(userResponse(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not reset the password. Please try again." });
  }
});
 
// ---------- LOGIN ----------
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
 
    const user = await User.findOne({ email: String(email).trim() });
 
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
 
    // Account created with Google has no password
    if (!user.passwordHash) {
      return res.status(400).json({ message: GOOGLE_ONLY_MESSAGE });
    }
 
    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
 
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
 
    // Checked after the password, so strangers cannot probe who is unverified
    if (!user.emailVerified) {
      let emailSent = true;
 
      // Send a fresh code automatically, unless one was sent a moment ago
      if (!onCooldown(user.verifyEmailSentAt)) {
        try {
          const code = attachVerifyCode(user);
          await user.save();
          await sendVerificationEmail(user, code);
        } catch (mailErr) {
          console.error(mailErr);
          emailSent = false;
        }
      }
 
      return res.status(403).json({
        message: "Please verify your email first.",
        needsVerification: true,
        email: user.email,
        emailSent,
      });
    }
 
    res.json(userResponse(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});
 
// ---------- ME ----------
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});
 
// ---------- GOOGLE ----------
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
 
    if (!credential) {
      return res.status(400).json({ message: "Google sign-in failed" });
    }
 
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
 
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, email_verified } = payload;
 
    if (!email || !email_verified) {
      return res
        .status(400)
        .json({ message: "Your Google email is not verified" });
    }
 
    let user = await User.findOne({ email });
 
    if (!user) {
      user = await User.create({ name, email, googleId, emailVerified: true });
    } else {
      let changed = false;
 
      if (!user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
 
      // Google proved this person owns the email. If the account was still
      // unverified, remove the password someone else may have set on it.
      if (!user.emailVerified) {
        user.emailVerified = true;
        user.passwordHash = undefined;
        user.verifyTokenHash = undefined;
        user.verifyTokenExpires = undefined;
        user.verifyAttempts = 0;
        changed = true;
      }
 
      if (changed) await user.save();
    }
 
    res.json(userResponse(user));
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Google sign-in failed" });
  }
});
 
module.exports = router;
 
