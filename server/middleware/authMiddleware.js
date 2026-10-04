const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  let token;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.method === "GET" && typeof req.query.token === "string") {
    // Download links cannot send headers, so GET requests may use ?token=
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  // 1) Is the token itself valid? If not, the answer is 401.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Not authorized, token invalid or expired" });
  }

  // 2) Does the account still exist? A database problem is NOT a bad token.
  try {
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, account no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth lookup error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const teacherOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "teacher" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied: teachers or admins only" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: admins only" });
  }
};

module.exports = { protect, teacherOrAdmin, adminOnly };