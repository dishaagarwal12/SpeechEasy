// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Login() {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'signin' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'signin' ? { email, password } : { name, email, password };

      const { data } = await API.post(endpoint, payload);
      login({ name: data.name, email: data.email }, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute top-6 right-6 w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
        style={{ backgroundColor: 'var(--accent-amber)' }}
      >
        <span
          className="w-5 h-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>

      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h1 className="font-display font-bold text-2xl text-center" style={{ color: 'var(--accent-amber)' }}>
          SpeechEasy
        </h1>
        <p className="text-xs text-center mt-1.5 mb-6" style={{ color: 'var(--text-muted)' }}>
          {mode === 'signin' ? 'Sign in to keep practicing' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••••"
              className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--accent-red)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-amber)', color: 'var(--on-amber)' }}
          >
            {loading ? 'Signing in...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-center mt-5" style={{ color: 'var(--text-muted)' }}>
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                onClick={() => setMode('register')}
                className="font-semibold"
                style={{ color: 'var(--accent-amber)' }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="font-semibold"
                style={{ color: 'var(--accent-amber)' }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Login;