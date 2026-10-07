require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const VivaSession = require("../models/VivaSession");

const DB_URL =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL;

async function run() {
  if (!DB_URL) {
    console.log("No database link found in .env");
    process.exit(1);
  }

  await mongoose.connect(DB_URL);

  const userIds = await User.distinct("_id");
  const filter = { student: { $nin: userIds } };

  const chats = await Conversation.countDocuments(filter);
  const vivas = await VivaSession.countDocuments(filter);
  console.log(`Chats belonging to deleted users: ${chats}`);
  console.log(`Viva sessions belonging to deleted users: ${vivas}`);

  if (process.argv.includes("--delete")) {
    const c = await Conversation.deleteMany(filter);
    const v = await VivaSession.deleteMany(filter);
    console.log(`Deleted chats: ${c.deletedCount}, viva sessions: ${v.deletedCount}`);
  } else {
    console.log("Dry run only. Run again with --delete to remove them.");
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});