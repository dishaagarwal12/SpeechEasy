// src/pages/SessionDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api/axios';

const SKILL_LABELS = {
  clarity: 'Clarity',
  pace: 'Pace',
  filler: 'Filler',
  structure: 'Structure',
  confidence: 'Confidence',
  vocabulary: 'Vocabulary',
};

// Wraps every occurrence of each filler word in the transcript with a
// highlighted <mark> tag, so they visually stand out when reading back
// what was said.
function highlightFillers(transcript, fillerCounts) {
  const words = Object.keys(fillerCounts || {});
  if (words.length === 0) return transcript;

  // Build one regex matching any of the filler words, case-insensitive,
  // as whole words only (so "like" doesn't match inside "likely")
  const pattern = new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

  const parts = transcript.split(pattern);
  return parts.map((part, i) =>
    words.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
      <mark
        key={i}
        style={{ backgroundColor: 'transparent', color: 'var(--accent-red)', fontWeight: 600 }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function formatDuration(seconds) {
  const mins = Math.floor((seconds || 0) / 60);
  const secs = (seconds || 0) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/sessions/${id}`);
      setSession(data);
    } catch (err) {
      setError('Could not load this session.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFeedback = async () => {
    setGeneratingFeedback(true);
    try {
      await API.post(`/sessions/${id}/ai-feedback`);
      await fetchSession(); // refetch so we get the saved feedback + scores
    } catch (err) {
      alert('Could not generate AI feedback. Please try again.');
    } finally {
      setGeneratingFeedback(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </Layout>
    );
  }

  if (error || !session) {
    return (
      <Layout>
        <p style={{ color: 'var(--accent-red)' }}>{error || 'Session not found.'}</p>
      </Layout>
    );
  }

  const hasFeedback = session.ai_feedback && session.ai_feedback.overall_status;

  return (
    <Layout>
      <button
        onClick={() => navigate('/archive')}
        className="text-xs mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to archive
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {session.mode}
        </h1>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {new Date(session.createdAt).toISOString().split('T')[0]} · {formatDuration(session.duration)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
        <div className="lg:col-span-2 rounded-2xl p-4" style={{ backgroundColor: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Transcript
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {highlightFillers(session.transcript, session.filler_word_counts)}
          </p>
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Stats
          </p>
          <div className="flex flex-col gap-3">
            <StatRow label="WPM" value={session.wpm || 0} color="var(--accent-teal)" />
            <StatRow
              label="Fillers"
              value={Object.values(session.filler_word_counts || {}).reduce((s, c) => s + c, 0)}
              color="var(--accent-red)"
            />
            <StatRow label="Duration" value={formatDuration(session.duration)} color="var(--text-primary)" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 mt-4" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI coaching feedback
          </p>
          {hasFeedback && (
            <button
              onClick={handleGenerateFeedback}
              disabled={generatingFeedback}
              className="text-xs"
              style={{ color: 'var(--accent-amber)' }}
            >
              {generatingFeedback ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
        </div>

        {!hasFeedback ? (
          <div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Get AI-powered coaching feedback on this session's clarity, structure, pace, and more.
            </p>
            <button
              onClick={handleGenerateFeedback}
              disabled={generatingFeedback}
              className="py-2.5 px-5 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: 'var(--accent-amber)', color: 'var(--on-amber)' }}
            >
              {generatingFeedback ? 'Analyzing...' : 'Generate AI feedback'}
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
              {session.ai_feedback.overall_status}
            </p>

            {session.ai_feedback.key_issues && session.ai_feedback.key_issues.length > 0 && (
              <div className="mb-4">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Key issues
                </p>
                <ul className="list-disc list-inside flex flex-col gap-1">
                  {session.ai_feedback.key_issues.map((issue, i) => (
                    <li key={i} className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'var(--bg-base)' }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: 'var(--accent-amber)' }}
              >
                Coaching tip
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {session.ai_feedback.coaching_tip}
              </p>
            </div>

            {session.skill_scores && session.skill_scores.clarity !== null && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(session.skill_scores).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
                      <span>{SKILL_LABELS[key]}</span>
                      <span>{value}</span>
                    </div>
                    <div className="rounded" style={{ backgroundColor: 'var(--border-color)', height: '5px' }}>
                      <div
                        className="rounded"
                        style={{ width: `${value}%`, height: '5px', backgroundColor: 'var(--accent-amber)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default SessionDetail;