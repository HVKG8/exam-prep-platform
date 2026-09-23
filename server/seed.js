require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("./models/Subject");
const Branch = require("./models/Branch");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  let branch = await Branch.findOne({ code: "COMP" });
  if (!branch) {
    branch = await Branch.create({ name: "Computer Engineering", code: "COMP" });
    console.log("Branch saved");
  } else {
    console.log("Branch already exists, reusing it");
  }

  let subject = await Subject.findOne({ name: "Artificial Intelligence", semester: 7 });
if (!subject) {
  subject = await Subject.create({
    name: "Artificial Intelligence",
    semester: 7,
    branch: branch._id
  });
  console.log("Subject saved");
} else {
  console.log("Subject already exists, reusing it");
}

  await mongoose.disconnect();
};

seed();