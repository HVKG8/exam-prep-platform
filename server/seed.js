require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("./models/Subject");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Subject.create({ name: "Artificial Intelligence", semester: 6 });
  console.log("Subject saved");
  await mongoose.disconnect();
};

seed();