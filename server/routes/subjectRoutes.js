const express = require("express");
const Subject = require("../models/Subject");

const router = express.Router();

router.get("/", async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
});

module.exports = router;