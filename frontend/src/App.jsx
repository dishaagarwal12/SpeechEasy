import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionArchive from './pages/SessionArchive';
import PracticeSession from './pages/PracticeSession';
import SessionDetail from './pages/SessionDetail';
import ProtectedRoute from './components/ProtectedRoute';
import AIInterview from './pages/AIInterview';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
  path="/practice"
  element={
    <ProtectedRoute>
      <PracticeSession />
    </ProtectedRoute>
  }
/>
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <SessionArchive />
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive/:id"
        element={
          <ProtectedRoute>
            <SessionDetail />
          </ProtectedRoute>
        }
      />
      <Route
  path="/interview"
  element={
    <ProtectedRoute>
      <AIInterview />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default App;