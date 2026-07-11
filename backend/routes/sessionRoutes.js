// routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
  getSessionSummary,
  generateAiFeedback,
  getWeeklyInsightHandler,
} = require('../controllers/sessionController');

router.post('/', protect, createSession);
router.get('/', protect, getSessions);
router.get('/summary', protect, getSessionSummary);
router.post('/weekly-insight', protect, getWeeklyInsightHandler);
router.get('/:id', protect, getSessionById);
router.delete('/:id', protect, deleteSession);
router.post('/:id/ai-feedback', protect, generateAiFeedback);

module.exports = router;