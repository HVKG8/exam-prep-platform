const express = require("express");
const Subject = require("../models/Subject");
const Branch = require("../models/Branch");

const router = express.Router();

router.get("/", async (req, res) => {
  const subjects = await Subject.find().populate("branch");
  res.json(subjects);
});

module.exports = router;