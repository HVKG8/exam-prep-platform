const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};


router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // TODO: hash the password here using bcrypt
const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  res.json({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  res.json({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});
});

router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;