// models/Interview.js
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    default: '',
  },
  questions: [
    {
      question: String,
      question_type: { type: String, enum: ['factual', 'behavioral'] },
      user_answer: String,
      wpm: Number,
      filler_word_counts: Object,
      is_correct: Boolean, // only meaningful for factual questions
      correct_answer: String, // only set for factual questions answered wrong
      delivery_note: String, // short note combining content + delivery
    },
  ],
  readiness_score: Number,
  summary: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Interview', interviewSchema);