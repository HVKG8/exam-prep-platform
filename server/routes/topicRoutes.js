const express = require("express");
const Topic = require("../models/Topic");
const Subject = require("../models/Subject");

const router = express.Router();

router.get("/", async (req, res) => {
  const topics = await Topic.find().populate("subject");
  res.json(topics);
});

module.exports = router;