// src/components/WeeklyInsight.jsx
import { useState } from 'react';
import API from '../api/axios';

const SKILL_LABELS = {
  clarity: 'clarity',
  pace: 'pace',
  filler: 'filler usage',
  structure: 'structure',
  confidence: 'confidence',
  vocabulary: 'vocabulary',
};

function WeeklyInsight() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/sessions/weekly-insight');
      setInsight(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: 'var(--border-color)' }}
        >
          ◉
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Weekly AI check-in
        </p>
      </div>

      {!insight && !loading && (
        <>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Get a short analysis of this week's sessions, plus one concrete thing to work on.
          </p>
          <button
            onClick={handleAnalyze}
            className="py-2.5 px-5 rounded-lg font-semibold text-sm"
            style={{ backgroundColor: 'var(--accent-amber)', color: 'var(--on-amber)' }}
          >
            Analyze my week
          </button>
        </>
      )}

      {loading && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Analyzing your sessions this week...
        </p>
      )}

      {error && (
        <p className="text-xs" style={{ color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}

      {insight && !loading && (
        <>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>
            {insight.summary}
          </p>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-base)' }}>
            <p
              className="text-[10px] font-semibold uppercase tracking-wide mb-1"
              style={{ color: 'var(--accent-amber)' }}
            >
              How to improve: {SKILL_LABELS[insight.weakest_skill]} (your weakest area, {insight.weakest_score})
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {insight.improvement_tip}
            </p>
          </div>
          <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
            Based on {insight.sessions_analyzed} session{insight.sessions_analyzed === 1 ? '' : 's'} this week
          </p>
        </>
      )}
    </div>
  );
}

export default WeeklyInsight;