// models/User.js
//
// This file defines the SHAPE of a "User" document in MongoDB.
// A Session document will later reference a User by its _id (like a
// foreign key in SQL) — this relationship lets us fetch "all sessions
// belonging to this user." MongoDB is a great fit here because even
// though User itself is simple and table-like, the Session and
// InterviewSession data (filler-word timelines, pause arrays, nested
// AI feedback objects) has a variable, nested shape that would need
// several rigid joined tables in SQL but fits naturally as one flexible
// document in MongoDB.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,      // no two users can share an email
    lowercase: true,   // always store emails in lowercase, avoids "Test@x.com" vs "test@x.com" duplicates
    trim: true,        // removes accidental leading/trailing spaces
  },
  password: {
    type: String,
    required: true, // this will store the HASHED password, never the real one
  },
}, {
  timestamps: true, // automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);