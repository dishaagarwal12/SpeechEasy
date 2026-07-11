// src/pages/AIInterview.jsx
import { useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import InterviewSession from '../components/InterviewSession';

const DOMAINS = ['Technical concepts', 'HR / Behavioral', 'General aptitude', 'Case study'];

function AIInterview() {
  const [domain, setDomain] = useState('Technical concepts');
  const [topic, setTopic] = useState('');
  const [resumeContext, setResumeContext] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState(null); // once set, interview begins
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/interviews/generate-questions', {
        domain,
        topic,
        resumeContext,
        numQuestions,
      });
      setQuestions(data.questions);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Once questions are generated, hand off entirely to the session component
  if (questions) {
    return (
      <InterviewSession
        domain={domain}
        topic={topic}
        questions={questions}
        onExit={() => setQuestions(null)}
      />
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
        Start a mock interview
      </h1>

      <div className="max-w-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Domain
        </p>
        <div className="flex gap-2 flex-wrap mb-5">
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={{
                backgroundColor: domain === d ? 'var(--accent-amber)' : 'transparent',
                color: domain === d ? 'var(--on-amber)' : 'var(--text-muted)',
                border: domain === d ? 'none' : '1px solid var(--border-color)',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Specific topic (optional)
        </p>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='e.g. "React hooks", "SQL joins", "System design basics"'
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-1"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
        <p className="text-[10px] mb-5" style={{ color: 'var(--text-muted)' }}>
          Leave blank for general questions in this domain
        </p>

        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Resume or job description (optional)
        </p>
        <textarea
          value={resumeContext}
          onChange={(e) => setResumeContext(e.target.value)}
          placeholder="Paste your resume or a job description to get questions tailored to your background..."
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-1"
          style={{ backgroundColor: 'var(--surface)', border: '1px dashed var(--accent-amber)', color: 'var(--text-primary)' }}
        />
        <p className="text-[10px] mb-5" style={{ color: 'var(--text-muted)' }}>
          When provided, questions reference your real projects/skills instead of generic ones
        </p>

        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Number of questions
        </p>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="number"
            min={1}
            max={15}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Math.max(1, Math.min(15, Number(e.target.value))))}
            className="w-20 px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            questions (max 15)
          </span>
        </div>

        {error && (
          <p className="text-xs mb-4" style={{ color: 'var(--accent-red)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="py-3 px-6 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-amber)', color: 'var(--on-amber)' }}
        >
          {loading ? 'Preparing questions...' : 'Start interview'}
        </button>
      </div>
    </Layout>
  );
}

export default AIInterview;