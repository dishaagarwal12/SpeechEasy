// routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { generateQuestions, completeInterview, getInterviewById } = require('../controllers/interviewController');

router.post('/generate-questions', protect, generateQuestions);
router.post('/', protect, completeInterview);
router.get('/:id', protect, getInterviewById);

module.exports = router;