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

// GET /api/admin/ai-usage  ->  numbers for the AI Usage page
router.get("/ai-usage", async (req, res) => {
  try {
    const DAYS = 14;
    const TZ = "Asia/Kolkata";
    const DAY_MS = 24 * 60 * 60 * 1000;

    // "2026-10-07" style key for a date, in Indian time
    const dayKey = (date) => date.toLocaleDateString("en-CA", { timeZone: TZ });

    // The last 14 days, oldest first
    const keys = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      keys.push(dayKey(new Date(Date.now() - i * DAY_MS)));
    }

    const since = new Date(Date.now() - (DAYS + 1) * DAY_MS);
    const usersCollection = User.collection.name;

    const [perDay, totalRows, topStudents, recent] = await Promise.all([
      // Questions asked per day
      Conversation.aggregate([
        { $unwind: "$messages" },
        { $match: { "messages.createdAt": { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$messages.createdAt",
                timezone: TZ,
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // All questions ever asked
      Conversation.aggregate([
        { $project: { n: { $size: "$messages" } } },
        { $group: { _id: null, total: { $sum: "$n" } } },
      ]),

      // Top 5 most active students
      Conversation.aggregate([
        { $project: { student: 1, n: { $size: "$messages" } } },
        { $group: { _id: "$student", questions: { $sum: "$n" } } },
        { $sort: { questions: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: usersCollection,
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            questions: 1,
            name: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Deleted user"] },
            email: { $ifNull: [{ $arrayElemAt: ["$user.email", 0] }, ""] },
          },
        },
      ]),

      // 15 most recent questions (the answers are not sent)
      Conversation.aggregate([
        { $sort: { updatedAt: -1 } },
        { $limit: 30 },
        { $unwind: "$messages" },
        { $sort: { "messages.createdAt": -1 } },
        { $limit: 15 },
        {
          $lookup: {
            from: usersCollection,
            localField: "student",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            question: "$messages.question",
            marks: "$messages.marks",
            createdAt: "$messages.createdAt",
            student: {
              $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Deleted user"],
            },
          },
        },
      ]),
    ]);

    const countByDay = {};
    perDay.forEach((row) => {
      countByDay[row._id] = row.count;
    });

    const daily = keys.map((date) => ({ date, count: countByDay[date] || 0 }));

    res.json({
      today: daily[daily.length - 1].count,
      last7: daily.slice(-7).reduce((sum, d) => sum + d.count, 0),
      total: totalRows[0]?.total || 0,
      daily,
      topStudents,
      recent: recent.map((r) => ({
        student: r.student,
        question: String(r.question || "").slice(0, 160),
        marks: r.marks || null,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("Admin AI usage error:", err.message);
    res.status(500).json({ message: "Could not load AI usage" });
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

    // Also remove this student's chats and viva sessions
    await Promise.all([
      Conversation.deleteMany({ student: user._id }),
      VivaSession.deleteMany({ student: user._id }),
    ]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Admin delete error:", err.message);
    res.status(500).json({ message: "Could not delete user" });
  }
});

module.exports = router;