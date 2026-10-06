const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const User = require("../models/User");
const Material = require("../models/Material");
const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const Question = require("../models/Question");
const Conversation = require("../models/Conversation");
const VivaSession = require("../models/VivaSession");

// Every route in this file is for admins only
router.use(protect, adminOnly);

// GET /api/admin/stats  ->  numbers for the Overview page
router.get("/stats", async (req, res) => {
  try {
    const [
      users,
      students,
      teachers,
      admins,
      materials,
      subjects,
      topics,
      questions,
      conversations,
      vivas,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),
      Material.countDocuments(),
      Subject.countDocuments(),
      Topic.countDocuments(),
      Question.countDocuments(),
      Conversation.countDocuments(),
      VivaSession.countDocuments(),
      User.find()
        .sort({ _id: -1 })
        .limit(5)
        .select("name email role createdAt"),
    ]);

    res.json({
      users: { total: users, students, teachers, admins },
      materials,
      subjects,
      topics,
      questions,
      conversations,
      vivas,
      recentUsers,
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({ message: "Could not load admin stats" });
  }
});

// GET /api/admin/users  ->  all users for the Users page
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ _id: -1 })
      .limit(500)
      .select("name email role createdAt");
    res.json(users);
  } catch (err) {
    console.error("Admin users error:", err.message);
    res.status(500).json({ message: "Could not load users" });
  }
});

// PATCH /api/admin/users/:id/role  ->  change someone's role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (req.user._id.toString() === req.params.id) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("name email role createdAt");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Admin role error:", err.message);
    res.status(500).json({ message: "Could not change role" });
  }
});

// DELETE /api/admin/users/:id  ->  remove a user
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Admin delete error:", err.message);
    res.status(500).json({ message: "Could not delete user" });
  }
});

module.exports = router;