// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ActivityHeatmap from '../components/ActivityHeatmap';
import WeeklyInsight from '../components/WeeklyInsight';
import API from '../api/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const SKILL_LABELS = {
  clarity: 'Clarity',
  pace: 'Pace',
  filler: 'Filler',
  structure: 'Structure',
  confidence: 'Confidence',
  vocabulary: 'Vocabulary',
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await API.get('/sessions/summary');
        setSummary(data);
      } catch (err) {
        setError('Could not load your stats. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const lineData = summary && {
    labels: summary.wpm_trend.map((_, i) => `S${i + 1}`),
    datasets: [
      { label: 'WPM', data: summary.wpm_trend, borderColor: '#0f9e8f', backgroundColor: '#0f9e8f', tension: 0.4 },
      { label: 'Fillers', data: summary.filler_trend, borderColor: '#e8961f', backgroundColor: '#e8961f', tension: 0.4 },
    ],
  };

  return (
    <Layout>
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Dashboard
      </h1>
      <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
        Your speaking practice, at a glance
      </p>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading your stats...</p>}
      {error && <p style={{ color: 'var(--accent-red)' }}>{error}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatCard label="Total sessions" value={summary.total_sessions} color="var(--text-primary)" />
            <StatCard label="Avg WPM" value={summary.avg_wpm} color="var(--accent-teal)" />
            <StatCard label="Avg fillers" value={summary.avg_filler_count} color="var(--accent-red)" />
            <StatCard label="This week" value={summary.sessions_this_week} color="var(--accent-amber)" />
          </div>

          {summary.total_sessions === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--surface)' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                No sessions yet — start your first practice session to see your stats here.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Practice activity
                </p>
                <ActivityHeatmap activityByDate={summary.activity_by_date} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-2 rounded-2xl p-4" style={{ backgroundColor: 'var(--surface)' }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Weekly performance
                  </p>
                  <Line
                    data={lineData}
                    options={{
                      responsive: true,
                      plugins: { legend: { labels: { color: 'var(--text-muted)' } } },
                      scales: {
                        x: { ticks: { color: '#8a8578' }, grid: { display: false } },
                        y: { ticks: { color: '#8a8578' }, grid: { color: 'var(--border-color)' } },
                      },
                    }}
                  />
                </div>

                <div className="rounded-2xl p-4 flex flex-col" style={{ backgroundColor: 'var(--surface)' }}>
  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
    Skill breakdown
  </p>
  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
    Average, this week
  </p>

  {!summary.skill_breakdown ? (
    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
      Run AI feedback on a session this week to see your skill breakdown.
    </p>
  ) : (
    <div className="flex flex-col flex-1">
      {(() => {
        const scores = Object.values(summary.skill_breakdown);
        const overall = Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
        const moodLabel = overall >= 80 ? 'Strong week — keep it up' : overall >= 60 ? 'Good progress this week' : 'Room to grow this week';

        return (
          <div className="flex items-center gap-3 rounded-xl p-3 mb-4" style={{ backgroundColor: 'var(--bg-base)' }}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ border: '4px solid var(--accent-amber)' }}
            >
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {overall}
              </span>
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-wide font-semibold mb-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Overall score
              </p>
              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                {moodLabel}
              </p>
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col gap-2.5 flex-1 justify-between">
        {Object.entries(summary.skill_breakdown).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-primary)' }}>
              <span>{SKILL_LABELS[key]}</span>
              <span>{value}</span>
            </div>
            <div className="rounded" style={{ backgroundColor: 'var(--border-color)', height: '6px' }}>
              <div
                className="rounded"
                style={{ width: `${value}%`, height: '6px', backgroundColor: 'var(--accent-amber)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
              </div>

              <WeeklyInsight />
            </>
          )}
        </>
      )}
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--surface)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export default Dashboard;