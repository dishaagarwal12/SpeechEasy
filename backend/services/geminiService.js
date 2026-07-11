// services/geminiService.js
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const buildCoachingPrompt = (transcript, stats) => {
  return `You are an expert speech and communication coach.

Analyze the following speech transcript and stats, then return ONLY a valid JSON object — no explanation, no markdown code fences, no extra text before or after.

The JSON object must have exactly these keys:
- "overall_status": one sentence describing the speaker's delivery quality for this session
- "key_issues": an array of the 2-3 most impactful problems detected (e.g. filler word clusters, weak conclusion, rushed pacing)
- "coaching_tip": one concrete, actionable suggestion based on this specific transcript
- "structure_flag": one sentence noting whether an intro/problem/solution/conclusion structure was followed, or "No structural issues identified" if it was
- "clarity_score": an integer 0-100 rating how clear and easy to follow the language was
- "structure_score": an integer 0-100 rating how well-organized the speech was
- "confidence_score": an integer 0-100 rating how confident the speaker sounded, based on word choice and phrasing
- "vocabulary_score": an integer 0-100 rating the richness and precision of vocabulary used

Transcript:
"""${transcript}"""

Stats:
Words per minute: ${stats.wpm}
Filler word counts: ${JSON.stringify(stats.filler_word_counts)}
Pause stats: ${JSON.stringify(stats.pause_stats)}

Remember: return ONLY the raw JSON object, nothing else.`;
};

const getCoachingFeedback = async (transcript, stats) => {
  const prompt = buildCoachingPrompt(transcript, stats);
  const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  const cleaned = result.text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini raw response (unparseable):', result.text);
    throw new Error('AI response could not be parsed');
  }
};

const buildWeeklyInsightPrompt = (transcripts, skillBreakdown, weakestSkill, weakestScore) => {
  const transcriptList = transcripts.map((t, i) => `Session ${i + 1}: """${t}"""`).join('\n\n');

  return `You are an expert speech and communication coach reviewing a student's practice sessions from this week.

Here are their session transcripts:
${transcriptList}

Their average skill scores this week (0-100 scale): ${JSON.stringify(skillBreakdown)}

Their weakest skill this week is "${weakestSkill}" with a score of ${weakestScore}.

Return ONLY a valid JSON object — no explanation, no markdown code fences, no extra text before or after.

The JSON object must have exactly these keys:
- "summary": 2-3 encouraging but honest sentences analyzing their overall week, referencing specific patterns you notice across the sessions
- "improvement_tip": one concrete, specific, practical exercise the student can do before their next session to improve their "${weakestSkill}" specifically. Be hands-on and actionable, not generic advice like "practice more."

Remember: return ONLY the raw JSON object, nothing else.`;
};

const getWeeklyInsight = async (transcripts, skillBreakdown, weakestSkill, weakestScore) => {
  const prompt = buildWeeklyInsightPrompt(transcripts, skillBreakdown, weakestSkill, weakestScore);
  const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  const cleaned = result.text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini raw response (unparseable):', result.text);
    throw new Error('AI response could not be parsed');
  }
};

const generateInterviewQuestions = async (domain, topic, resumeContext, numQuestions) => {
  const prompt = `You are an expert interviewer creating a mock interview.

Domain: ${domain}
${topic ? `Specific topic focus: ${topic}` : ''}
${resumeContext ? `Candidate's background (resume/job description):\n"""${resumeContext}"""\n\nTailor some questions to reference this background specifically.` : ''}

Generate exactly ${numQuestions} interview questions.

Return ONLY a valid JSON array — no explanation, no markdown code fences.

Each item in the array must have exactly these keys:
- "question": the interview question text
- "question_type": either "factual" (has one objectively correct answer, e.g. technical concepts) or "behavioral" (evaluated on quality of reasoning/communication, not right/wrong)
- "reference_answer": if question_type is "factual", a concise correct answer (1-2 sentences). If question_type is "behavioral", this must be null.

Remember: return ONLY the raw JSON array, nothing else.`;

  const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  const cleaned = result.text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini raw response (unparseable):', result.text);
    throw new Error('AI response could not be parsed');
  }
};

const gradeInterview = async (domain, questionsWithAnswers) => {
  const qaList = questionsWithAnswers
    .map(
      (q, i) =>
        `Q${i + 1} (${q.question_type}): "${q.question}"\nCandidate's answer: "${q.user_answer}"\nDelivery: ${q.wpm} wpm, ${Object.values(q.filler_word_counts || {}).reduce((s, c) => s + c, 0)} filler words\n${q.reference_answer ? `Reference answer: "${q.reference_answer}"` : ''}`
    )
    .join('\n\n');

  const prompt = `You are an expert interview coach grading a completed mock interview in the domain of "${domain}".

Here are the questions, the candidate's spoken answers, and their delivery stats:

${qaList}

Return ONLY a valid JSON object — no explanation, no markdown code fences.

The JSON object must have exactly these keys:
- "overall_summary": 2-3 sentences summarizing performance across content quality AND delivery (pace, filler words)
- "readiness_score": an integer 0-100 combining both content accuracy/quality and delivery confidence
- "graded_questions": an array with one entry per question, in the same order, each with:
  - "is_correct": true/false for factual questions (judge against the reference answer); for behavioral questions, true if the answer was reasonably strong, false if weak/vague
  - "delivery_note": one specific sentence combining what was said with how it was delivered (e.g. "Correct concept, but hesitant delivery with several filler words")

Remember: return ONLY the raw JSON object, nothing else.`;

  const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  const cleaned = result.text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini raw response (unparseable):', result.text);
    throw new Error('AI response could not be parsed');
  }
};

module.exports = {
  getCoachingFeedback,
  getWeeklyInsight,
  generateInterviewQuestions,
  gradeInterview,
};