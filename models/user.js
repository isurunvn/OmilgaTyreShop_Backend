// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true },
  password: { type: String, required: true},
  role: { type: String, enum: ['admin','user'], default: 'user', required: false}
});

module.exports = mongoose.model('User', userSchema);
