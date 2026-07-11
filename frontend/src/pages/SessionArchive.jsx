// src/pages/SessionArchive.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api/axios';

const MODE_STYLES = {
  'Free Practice': { bg: 'rgba(232, 150, 31, 0.15)', color: 'var(--accent-amber)', label: 'FREE' },
  'Timed Pitch': { bg: 'rgba(15, 158, 143, 0.15)', color: 'var(--accent-teal)', label: 'TIMED' },
  'Q&A': { bg: 'rgba(210, 60, 55, 0.15)', color: 'var(--accent-red)', label: 'Q&A' },
  Interview: { bg: 'var(--border-color)', color: 'var(--text-muted)', label: 'INTERVIEW' },
  Presentation: { bg: 'var(--border-color)', color: 'var(--text-muted)', label: 'PRESENT' },
  Debate: { bg: 'var(--border-color)', color: 'var(--text-muted)', label: 'DEBATE' },
};

function formatDuration(seconds) {
  const mins = Math.floor((seconds || 0) / 60);
  const secs = (seconds || 0) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function totalFillers(fillerCounts) {
  return Object.values(fillerCounts || {}).reduce((sum, c) => sum + c, 0);
}

function SessionArchive() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/sessions');
      setSessions(data);
    } catch (err) {
      setError('Could not load your sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // don't trigger the row's click-to-open when clicking delete
    const confirmed = window.confirm('Delete this session? This cannot be undone.');
    if (!confirmed) return;

    try {
      await API.delete(`/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert('Could not delete this session. Please try again.');
    }
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Session archive
      </h1>
      <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
        {loading ? 'Loading...' : `${sessions.length} recordings · click a row to review`}
      </p>

      {error && <p style={{ color: 'var(--accent-red)' }}>{error}</p>}

      {!loading && sessions.length === 0 && (
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--surface)' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            No sessions yet — start your first practice session to see it here.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sessions.map((session) => {
          const style = MODE_STYLES[session.mode] || MODE_STYLES['Free Practice'];
          return (
            <div
              key={session._id}
              onClick={() => navigate(`/archive/${session._id}`)}
              className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-md"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {style.label}
              </span>

              <span className="flex-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(session.createdAt).toISOString().split('T')[0]}
              </span>

              <span className="text-xs w-12 text-right" style={{ color: 'var(--text-primary)' }}>
                {formatDuration(session.duration)}
              </span>

              <span className="text-xs w-20 text-right font-semibold" style={{ color: 'var(--accent-teal)' }}>
                {session.wpm || 0} wpm
              </span>

              <span className="text-xs w-20 text-right font-semibold" style={{ color: 'var(--accent-red)' }}>
                {totalFillers(session.filler_word_counts)} fillers
              </span>

              <button
                onClick={(e) => handleDelete(e, session._id)}
                className="text-sm px-1"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Delete session"
              >
                🗑
              </button>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

export default SessionArchive;