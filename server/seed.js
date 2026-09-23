require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("./models/Subject");
const Branch = require("./models/Branch");
const Topic = require("./models/Topic");
const Note = require("./models/Note");

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
   let topic = await Topic.findOne({ title: "Search Algorithms", subject: subject._id });
   if (!topic) {
     topic = await Topic.create({
       title: "Search Algorithms",
       subject: subject._id
    });
     console.log("Topic saved");
   } else {
     console.log("Topic already exists, reusing it");
   }

    let note = await Note.findOne({ title: "Binary Search Basics" });
    if (!note) {
      note = await Note.create({
        title: "Binary Search Basics",
        topic: topic._id,
        content: "Binary search works on a sorted array by repeatedly dividing the search range in half...",
      });
      console.log("Note created:", note.title);
    } else {
      console.log("Note already exists:", note.title);
    }
    
  await mongoose.disconnect();
};

seed();