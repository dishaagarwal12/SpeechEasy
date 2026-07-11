// src/components/Layout.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/practice', label: 'Practice session' },
  { to: '/archive', label: 'Session archive' },
  { to: '/interview', label: 'AI interview' },
];

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — always dark, regardless of theme */}
      <aside
        className="w-56 flex flex-col p-5 shrink-0"
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        <h1 className="font-display font-bold text-lg" style={{ color: 'var(--accent-amber)' }}>
          SpeechEasy
        </h1>

        <nav className="flex flex-col gap-1 mt-8 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm px-3 py-2 rounded-lg transition-colors ${isActive ? 'font-semibold' : ''}`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--accent-amber)' : 'transparent',
                color: isActive ? 'var(--on-amber)' : '#b8b0a0',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4" style={{ borderTop: '1px solid var(--sidebar-bg-alt)' }}>
          <button
            onClick={toggleTheme}
            className="text-xs mb-3 px-2 py-1 rounded"
            style={{ color: '#b8b0a0' }}
          >
            {theme === 'dark' ? '☀ Light mode' : '● Dark mode'}
          </button>
          <p className="text-sm font-semibold" style={{ color: '#f0ece2' }}>
            {user?.name}
          </p>
          <button
            onClick={handleSignOut}
            className="text-xs mt-1"
            style={{ color: '#8a8578' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area — this is where each page's content renders */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}

export default Layout;