const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
    passwordHash: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    required: false,
  },
  role: {
  type: String,
  enum: ['student', 'teacher', 'admin'],
  default: 'student',
},
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);