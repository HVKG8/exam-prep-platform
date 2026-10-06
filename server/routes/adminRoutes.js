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

module.exports = router;