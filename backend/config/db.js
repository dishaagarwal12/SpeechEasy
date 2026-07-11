// config/db.js
// This file's only job: connect to our MongoDB database using Mongoose.
// We export a function so server.js can call it once when the server starts.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Stop the server — never run with a broken database
  }
};

module.exports = connectDB;