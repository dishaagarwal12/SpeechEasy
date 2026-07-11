// controllers/interviewController.js
const Interview = require('../models/Interview');
const { generateInterviewQuestions, gradeInterview } = require('../services/geminiService');

// @route  POST /api/interviews/generate-questions
const generateQuestions = async (req, res) => {
  try {
    const { domain, topic, resumeContext, numQuestions } = req.body;

    if (!domain || !numQuestions) {
      return res.status(400).json({ message: 'Domain and number of questions are required' });
    }

    const questions = await generateInterviewQuestions(domain, topic, resumeContext, numQuestions);
    res.status(200).json({ questions });
  } catch (error) {
    console.error('Generate questions error:', error.message);
    res.status(500).json({ message: 'AI response could not be parsed' });
  }
};

// @route  POST /api/interviews
// @desc   Grade the completed interview and save it
const completeInterview = async (req, res) => {
  try {
    const { domain, topic, questions } = req.body;

    if (!domain || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Domain and answered questions are required' });
    }

    const graded = await gradeInterview(domain, questions);

    const finalQuestions = questions.map((q, i) => ({
      question: q.question,
      question_type: q.question_type,
      user_answer: q.user_answer,
      wpm: q.wpm,
      filler_word_counts: q.filler_word_counts,
      is_correct: graded.graded_questions[i]?.is_correct ?? null,
      correct_answer: q.question_type === 'factual' ? q.reference_answer : null,
      delivery_note: graded.graded_questions[i]?.delivery_note ?? '',
    }));

    const interview = await Interview.create({
      user: req.user._id,
      domain,
      topic: topic || '',
      questions: finalQuestions,
      readiness_score: graded.readiness_score,
      summary: graded.overall_summary,
    });

    res.status(201).json(interview);
  } catch (error) {
    console.error('Complete interview error:', error.message);
    res.status(500).json({ message: 'AI response could not be parsed' });
  }
};

// @route  GET /api/interviews/:id
const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.status(200).json(interview);
  } catch (error) {
    console.error('Get interview error:', error.message);
    res.status(500).json({ message: 'Something went wrong while fetching the interview' });
  }
};

module.exports = { generateQuestions, completeInterview, getInterviewById };