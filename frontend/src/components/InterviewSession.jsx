// src/components/InterviewSession.jsx
import { useState, useRef, useEffect } from 'react';
import Layout from './Layout';
import API from '../api/axios';

const FILLER_WORDS = ['um', 'uh', 'like', 'so', 'basically', 'actually', 'literally', 'you know'];

function countFillerWords(transcript) {
  const counts = {};
  const lowerTranscript = transcript.toLowerCase();
  FILLER_WORDS.forEach((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerTranscript.match(pattern);
    if (matches) counts[word] = matches.length;
  });
  return counts;
}

function InterviewSession({ domain, topic, questions, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('speaking');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [micError, setMicError] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalChunk += res[0].transcript + ' ';
        else interimChunk += res[0].transcript;
      }
      if (finalChunk) setTranscript((prev) => prev + finalChunk);
      setInterimText(interimChunk);
    };

    // IMPORTANT: log the real error instead of failing silently
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setMicError(`Mic error: ${event.error}`);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // already stopped — safe to ignore
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== 'speaking') return;

    setTranscript('');
    setInterimText('');
    setElapsedSeconds(0);
    setMicError('');

    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.rate = 1;
    utterance.onend = () => {
      setPhase('listening');
    };
    window.speechSynthesis.speak(utterance);

    return () => window.speechSynthesis.cancel();
  }, [currentIndex, phase]);

  useEffect(() => {
    if (phase !== 'listening') return;
    if (!recognitionRef.current) return;

    // Small delay before starting the mic — gives the browser a moment
    // to fully release audio resources right after text-to-speech ends,
    // which avoids a silent "already started" failure in some browsers.
    const startTimeout = setTimeout(() => {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Could not start recognition:', e);
        setMicError('Could not start the microphone. Try clicking "Finish answer" and moving on.');
      }
    }, 300);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(timerRef.current);
    };
  }, [phase]);

  const finishAnswering = () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // already stopped — safe to ignore
    }
    clearInterval(timerRef.current);

    const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const minutes = elapsedSeconds / 60;
    const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;
    const fillerCounts = countFillerWords(transcript);

    const answer = {
      question: currentQuestion.question,
      question_type: currentQuestion.question_type,
      reference_answer: currentQuestion.reference_answer,
      user_answer: transcript.trim(),
      wpm,
      filler_word_counts: fillerCounts,
    };

    const updatedAnswers = [...answers, answer];
    setAnswers(updatedAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setPhase('speaking');
    } else {
      submitInterview(updatedAnswers);
    }
  };

  const submitInterview = async (finalAnswers) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data } = await API.post('/interviews', {
        domain,
        topic,
        questions: finalAnswers,
      });
      setResult(data);
    } catch (err) {
      setSubmitError('Could not grade this interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <Layout>
        <button onClick={onExit} className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          ← Start a new interview
        </button>

        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Interview results
        </h1>
        <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
          {result.domain} {result.topic && `· ${result.topic}`} · {result.questions.length} questions
        </p>

        <div className="rounded-2xl p-4 flex items-center gap-4 mb-5" style={{ backgroundColor: 'var(--surface)' }}>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: '5px solid var(--accent-amber)' }}
          >
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {result.readiness_score}
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>
              Interview readiness score
            </p>
            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
              {result.summary}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {result.questions.map((q, i) => (
            <div
              key={i}
              className="rounded-xl p-3"
              style={{
                backgroundColor: 'var(--surface)',
                borderLeft: `3px solid ${q.is_correct ? 'var(--accent-teal)' : 'var(--accent-red)'}`,
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <p
                  className="text-[10px] font-semibold"
                  style={{ color: q.is_correct ? 'var(--accent-teal)' : 'var(--accent-red)' }}
                >
                  {q.is_correct ? '✓ Correct' : '✗ Needs work'}
                </p>
                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  {q.wpm} wpm · {Object.values(q.filler_word_counts || {}).reduce((s, c) => s + c, 0)} fillers
                </p>
              </div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
                {q.question}
              </p>
              {q.delivery_note && (
                <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
                  {q.delivery_note}
                </p>
              )}
              {!q.is_correct && q.correct_answer && (
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <b style={{ color: 'var(--text-primary)' }}>Correct answer:</b> {q.correct_answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (submitting) {
    return (
      <Layout>
        <p style={{ color: 'var(--text-muted)' }}>Grading your interview...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex gap-1.5 mb-3">
        {questions.map((_, i) => (
          <div
            key={i}
            className="rounded"
            style={{
              width: '22px',
              height: '5px',
              backgroundColor: i <= currentIndex ? 'var(--accent-amber)' : 'var(--border-color)',
            }}
          />
        ))}
      </div>
      <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
        Question {currentIndex + 1} of {questions.length} · {domain}
      </p>

      <div className="flex flex-col items-center">
        <div className="rounded-2xl p-5 w-full max-w-xl text-center mb-5" style={{ backgroundColor: 'var(--surface)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {currentQuestion.question}
          </p>
        </div>

        {phase === 'speaking' && (
          <>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: 'var(--accent-amber)' }}
            >
              <span className="text-lg">🔊</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              AI is asking the question...
            </p>
          </>
        )}

        {phase === 'listening' && (
          <>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: 'var(--accent-teal)' }}
            >
              <span className="text-lg">🎙</span>
            </div>

            {micError && (
              <p className="text-xs mb-3" style={{ color: 'var(--accent-red)' }}>
                {micError}
              </p>
            )}

            <div
              className="rounded-xl p-3 w-full max-w-xl text-left mb-3"
              style={{ backgroundColor: 'var(--surface)', minHeight: '48px' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                {transcript}
                <span style={{ color: 'var(--text-muted)' }}>{interimText}</span>
                {!transcript && !interimText && (
                  <span style={{ color: 'var(--text-muted)' }}>Listening for your answer...</span>
                )}
              </p>
            </div>
            <button
              onClick={finishAnswering}
              className="text-xs px-5 py-2.5 rounded-lg font-semibold"
              style={{ backgroundColor: 'var(--accent-amber)', color: 'var(--on-amber)' }}
            >
              {currentIndex + 1 < questions.length ? 'Finish answer & continue' : 'Finish & get results'}
            </button>
          </>
        )}
      </div>

      {submitError && (
        <p className="text-xs mt-4" style={{ color: 'var(--accent-red)' }}>
          {submitError}
        </p>
      )}
    </Layout>
  );
}

export default InterviewSession;