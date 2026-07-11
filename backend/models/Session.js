// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mode: {
    type: String,
    enum: ['Free Practice', 'Timed Pitch', 'Q&A', 'Interview', 'Presentation', 'Debate'],
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  wpm: {
    type: Number,
    default: 0,
  },
  filler_word_counts: {
    type: Object,
    default: {},
  },
  pause_stats: {
    type: Object,
    default: {},
  },
  ai_feedback: {
    overall_status: String,
    key_issues: [String],
    coaching_tip: String,
    structure_flag: String,
  },
  skill_scores: {
    clarity: { type: Number, default: null },
    pace: { type: Number, default: null },
    filler: { type: Number, default: null },
    structure: { type: Number, default: null },
    confidence: { type: Number, default: null },
    vocabulary: { type: Number, default: null },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Session', sessionSchema);