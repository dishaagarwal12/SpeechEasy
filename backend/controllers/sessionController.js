// controllers/sessionController.js
const Session = require('../models/Session');
const { getCoachingFeedback, getWeeklyInsight } = require('../services/geminiService');

// @route  POST /api/sessions
const createSession = async (req, res) => {
  try {
    const { mode, transcript, duration, wpm, filler_word_counts, pause_stats } = req.body;

    if (!mode || !transcript) {
      return res.status(400).json({ message: 'Mode and transcript are required' });
    }

    const session = await Session.create({
      user: req.user._id,
      mode,
      transcript,
      duration,
      wpm,
      filler_word_counts,
      pause_stats,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error.message);
    res.status(500).json({ message: 'Something went wrong while saving the session' });
  }
};

// @route  GET /api/sessions
const getSessions = async (req, res) => {
  try {
    const { mode, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (mode) filter.mode = mode;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sessions = await Session.find(filter).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error.message);
    res.status(500).json({ message: 'Something went wrong while fetching sessions' });
  }
};

// @route  GET /api/sessions/:id
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json(session);
  } catch (error) {
    console.error('Get session by id error:', error.message);
    res.status(500).json({ message: 'Something went wrong while fetching the session' });
  }
};

// @route  DELETE /api/sessions/:id
const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error.message);
    res.status(500).json({ message: 'Something went wrong while deleting the session' });
  }
};

// @route  GET /api/sessions/summary
const getSessionSummary = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort({ createdAt: 1 });
    const total_sessions = sessions.length;

    if (total_sessions === 0) {
      return res.status(200).json({
        total_sessions: 0,
        avg_wpm: 0,
        avg_filler_count: 0,
        filler_trend: [],
        wpm_trend: [],
        sessions_this_week: 0,
        activity_by_date: {},
        skill_breakdown: null,
      });
    }

    const totalFillersInSession = (session) => {
      const counts = session.filler_word_counts || {};
      return Object.values(counts).reduce((sum, count) => sum + count, 0);
    };

    const totalWpm = sessions.reduce((sum, s) => sum + (s.wpm || 0), 0);
    const avg_wpm = Math.round(totalWpm / total_sessions);

    const totalFillers = sessions.reduce((sum, s) => sum + totalFillersInSession(s), 0);
    const avg_filler_count = Math.round(totalFillers / total_sessions);

    const last10 = sessions.slice(-10);
    const wpm_trend = last10.map((s) => s.wpm || 0);
    const filler_trend = last10.map((s) => totalFillersInSession(s));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const sessionsThisWeek = sessions.filter((s) => s.createdAt >= oneWeekAgo);
    const sessions_this_week = sessionsThisWeek.length;

    const activity_by_date = {};
    sessions.forEach((s) => {
      const dateKey = s.createdAt.toISOString().split('T')[0];
      activity_by_date[dateKey] = (activity_by_date[dateKey] || 0) + 1;
    });

    const scoredThisWeek = sessionsThisWeek.filter((s) => s.skill_scores && s.skill_scores.clarity !== null);

    let skill_breakdown = null;
    if (scoredThisWeek.length > 0) {
      const skillKeys = ['clarity', 'pace', 'filler', 'structure', 'confidence', 'vocabulary'];
      skill_breakdown = {};
      skillKeys.forEach((key) => {
        const total = scoredThisWeek.reduce((sum, s) => sum + (s.skill_scores[key] || 0), 0);
        skill_breakdown[key] = Math.round(total / scoredThisWeek.length);
      });
    }

    res.status(200).json({
      total_sessions,
      avg_wpm,
      avg_filler_count,
      filler_trend,
      wpm_trend,
      sessions_this_week,
      activity_by_date,
      skill_breakdown,
    });
  } catch (error) {
    console.error('Get session summary error:', error.message);
    res.status(500).json({ message: 'Something went wrong while computing session summary' });
  }
};

// @route  POST /api/sessions/:id/ai-feedback
const generateAiFeedback = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const feedback = await getCoachingFeedback(session.transcript, {
      wpm: session.wpm,
      filler_word_counts: session.filler_word_counts,
      pause_stats: session.pause_stats,
    });

    const calculatePaceScore = (wpm) => {
      if (!wpm) return 0;
      if (wpm >= 130 && wpm <= 160) return 100;
      const distance = wpm < 130 ? 130 - wpm : wpm - 160;
      return Math.max(0, Math.round(100 - distance * 1.5));
    };

    const calculateFillerScore = (fillerCounts, durationSeconds) => {
      const totalFillers = Object.values(fillerCounts || {}).reduce((sum, c) => sum + c, 0);
      const durationMinutes = (durationSeconds || 60) / 60;
      const fillerRate = totalFillers / durationMinutes;
      if (fillerRate <= 2) return 100;
      return Math.max(0, Math.round(100 - (fillerRate - 2) * 15));
    };

    const pace_score = calculatePaceScore(session.wpm);
    const filler_score = calculateFillerScore(session.filler_word_counts, session.duration);

    session.ai_feedback = {
      overall_status: feedback.overall_status,
      key_issues: feedback.key_issues,
      coaching_tip: feedback.coaching_tip,
      structure_flag: feedback.structure_flag,
    };

    session.skill_scores = {
      clarity: feedback.clarity_score,
      pace: pace_score,
      filler: filler_score,
      structure: feedback.structure_score,
      confidence: feedback.confidence_score,
      vocabulary: feedback.vocabulary_score,
    };

    await session.save();

    res.status(200).json({
      ai_feedback: session.ai_feedback,
      skill_scores: session.skill_scores,
    });
  } catch (error) {
    console.error('AI feedback error:', error.message);
    res.status(500).json({ message: 'AI response could not be parsed' });
  }
};

// @route  POST /api/sessions/weekly-insight
const getWeeklyInsightHandler = async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const sessionsThisWeek = await Session.find({
      user: req.user._id,
      createdAt: { $gte: oneWeekAgo },
    }).sort({ createdAt: 1 });

    if (sessionsThisWeek.length === 0) {
      return res.status(400).json({ message: 'No sessions this week yet — practice first to get an analysis' });
    }

    const scoredSessions = sessionsThisWeek.filter((s) => s.skill_scores && s.skill_scores.clarity !== null);

    if (scoredSessions.length === 0) {
      return res.status(400).json({ message: 'Run AI feedback on at least one session this week first' });
    }

    const skillKeys = ['clarity', 'pace', 'filler', 'structure', 'confidence', 'vocabulary'];
    const skillBreakdown = {};
    skillKeys.forEach((key) => {
      const total = scoredSessions.reduce((sum, s) => sum + (s.skill_scores[key] || 0), 0);
      skillBreakdown[key] = Math.round(total / scoredSessions.length);
    });

    let weakestSkill = skillKeys[0];
    skillKeys.forEach((key) => {
      if (skillBreakdown[key] < skillBreakdown[weakestSkill]) {
        weakestSkill = key;
      }
    });
    const weakestScore = skillBreakdown[weakestSkill];

    const transcripts = sessionsThisWeek.map((s) => s.transcript);

    const insight = await getWeeklyInsight(transcripts, skillBreakdown, weakestSkill, weakestScore);

    res.status(200).json({
      summary: insight.summary,
      improvement_tip: insight.improvement_tip,
      weakest_skill: weakestSkill,
      weakest_score: weakestScore,
      sessions_analyzed: sessionsThisWeek.length,
    });
  } catch (error) {
    console.error('Weekly insight error:', error.message);
    res.status(500).json({ message: 'AI response could not be parsed' });
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
  getSessionSummary,
  generateAiFeedback,
  getWeeklyInsightHandler,
};