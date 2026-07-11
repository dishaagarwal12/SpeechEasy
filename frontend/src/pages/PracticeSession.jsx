// src/pages/PracticeSession.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api/axios';

const MODES = ['Free Practice', 'Timed Pitch', 'Q&A'];
const FILLER_WORDS = ['um', 'uh', 'like', 'so', 'basically', 'actually', 'literally', 'you know'];
const PITCH_DURATIONS = [60, 90, 120, 180];

const QA_QUESTIONS = [
  'Tell me about yourself.',
  'Why do you want this role?',
  'Describe a challenge you overcame recently.',
  'What are your greatest strengths?',
  'Where do you see yourself in five years?',
  'Tell me about a time you disagreed with a teammate.',
  'What motivates you to do your best work?',
  'Describe a project you are proud of.',
  'How do you handle pressure or tight deadlines?',
  'What is something you would like to improve about yourself?',
  'Tell me about a time you failed and what you learned.',
  'Why should we choose you over other candidates?',
];

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

function getRandomQuestion() {
  return QA_QUESTIONS[Math.floor(Math.random() * QA_QUESTIONS.length)];
}

function PracticeSession() {
  const [mode, setMode] = useState('Free Practice');
  const [pitchDuration, setPitchDuration] = useState(60);
  const [qaQuestion, setQaQuestion] = useState(getRandomQuestion());
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notSupported, setNotSupported] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotSupported(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalChunk += result[0].transcript + ' ';
        else interimChunk += result[0].transcript;
      }
      if (finalChunk) setTranscript((prev) => prev + finalChunk);
      setInterimText(interimChunk);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  // Auto-stop when a Timed Pitch reaches its chosen duration
  useEffect(() => {
    if (mode === 'Timed Pitch' && isRecording && elapsedSeconds >= pitchDuration) {
      stopRecording();
    }
  }, [elapsedSeconds, mode, isRecording, pitchDuration]);

  const startRecording = () => {
    if (!recognitionRef.current) return;

    setTranscript('');
    setInterimText('');
    setElapsedSeconds(0);
    setHasRecorded(false);
    setSaveError('');
    recognitionRef.current.start();
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
    setIsRecording(false);
    setHasRecorded(true);
    clearInterval(timerRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const minutesElapsed = elapsedSeconds / 60;
  const currentWpm = minutesElapsed > 0 ? Math.round(wordCount / minutesElapsed) : 0;
  const fillerCounts = countFillerWords(transcript);
  const totalFillers = Object.values(fillerCounts).reduce((sum, c) => sum + c, 0);

  const handleModeChange = (m) => {
    if (isRecording) return;
    setMode(m);
    setHasRecorded(false);
    setTranscript('');
    setElapsedSeconds(0);
    if (m === 'Q&A') setQaQuestion(getRandomQuestion());
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await API.post('/sessions', {
        mode,
        transcript: transcript.trim(),
        duration: elapsedSeconds,
        wpm: currentWpm,
        filler_word_counts: fillerCounts,
        pause_stats: {},
      });
      navigate(`/archive/${data._id}`);
    } catch (err) {
      setSaveError('Could not save this session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setTranscript('');
    setInterimText('');
    setElapsedSeconds(0);
    setHasRecorded(false);
    setSaveError('');
    if (mode === 'Q&A') setQaQuestion(getRandomQuestion());
  };

  if (notSupported) {
    return (
      <Layout>
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--surface)' }}>
          <p style={{ color: 'var(--accent-red)' }}>
            Your browser doesn't support live speech recognition. Please use Google Chrome or Microsoft Edge.
          </p>
        </div>
      </Layout>
    );
  }

  // What the big timer number shows: counts UP normally, counts DOWN for Timed Pitch
  const displaySeconds = mode === 'Timed Pitch' ? Math.max(0, pitchDuration - elapsedSeconds) : elapsedSeconds;
  const isNearEnd = mode === 'Timed Pitch' && isRecording && displaySeconds <= 10;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              disabled={isRecording}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={{
                backgroundColor: mode === m ? 'var(--accent-amber)' : 'transparent',
                color: mode === m ? 'var(--on-amber)' : 'var(--text-muted)',
                border: mode === m ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="text-right">
          <div className="flex gap-4 justify-end">
            <StatPill label="WPM" value={currentWpm} color="var(--accent-teal)" />
            <StatPill label="Fillers" value={totalFillers} color="var(--accent-red)" />
          </div>
          <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
            "um"/"uh" detection is limited by browser support — improving in a future update
          </p>
        </div>
      </div>

      {/* Timed Pitch: duration picker, shown only before starting */}
      {mode === 'Timed Pitch' && !isRecording && !hasRecorded && (
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--surface)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Choose your pitch length
          </p>
          <div className="flex gap-2">
            {PITCH_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setPitchDuration(d)}
                className="text-xs font-semibold px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: pitchDuration === d ? 'var(--accent-amber)' : 'transparent',
                  color: pitchDuration === d ? 'var(--on-amber)' : 'var(--text-muted)',
                  border: pitchDuration === d ? 'none' : '1px solid var(--border-color)',
                }}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q&A: the question prompt */}
      {mode === 'Q&A' && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {qaQuestion}
          </p>
          {!isRecording && !hasRecorded && (
            <button
              onClick={() => setQaQuestion(getRandomQuestion())}
              className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 ml-3"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            >
              New question
            </button>
          )}
        </div>
      )}

      <div className="rounded-2xl p-5 mb-5 min-h-[160px]" style={{ backgroundColor: 'var(--surface)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {transcript}
          <span style={{ color: 'var(--text-muted)' }}>{interimText}</span>
          {!transcript && !interimText && (
            <span style={{ color: 'var(--text-muted)' }}>Press record to begin. Live transcript appears here...</span>
          )}
        </p>
      </div>

      {!hasRecorded ? (
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-2xl font-bold font-display"
            style={{ color: isNearEnd ? 'var(--accent-red)' : 'var(--text-primary)' }}
          >
            {formatTime(displaySeconds)}
          </p>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              backgroundColor: isRecording ? 'var(--accent-red)' : 'var(--accent-amber)',
              color: 'var(--on-amber)',
            }}
          >
            {isRecording ? '■' : '●'}
          </button>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isRecording
              ? mode === 'Timed Pitch'
                ? 'Recording — will auto-stop at 0:00'
                : 'Tap to stop'
              : 'Tap mic to begin'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Recording stopped — {formatTime(elapsedSeconds)}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Save this session to see it in your archive and dashboard, or discard and record again.
          </p>

          {saveError && (
            <p className="text-xs mb-3" style={{ color: 'var(--accent-red)' }}>
              {saveError}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="text-xs px-5 py-2.5 rounded-lg font-semibold"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !transcript.trim()}
              className="text-xs px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-amber)', color: 'var(--on-amber)' }}
            >
              {saving ? 'Saving...' : 'Save session'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="text-right">
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export default PracticeSession;