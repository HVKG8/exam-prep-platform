require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await User.updateMany(
    { emailVerified: { $exists: false } },
    { $set: { emailVerified: true } }
  );
  console.log("Existing users marked verified:", result.modifiedCount);
  await mongoose.disconnect();
})();