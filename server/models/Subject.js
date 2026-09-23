const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    enum: [7, 8]
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);