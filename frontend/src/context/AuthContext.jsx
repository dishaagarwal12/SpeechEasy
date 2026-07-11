// src/context/AuthContext.jsx
//
// This makes "who is logged in" available to ANY component in the app,
// without manually passing it down through every layer of components
// (called "prop drilling"). Login/Register pages call login(), the
// Navbar reads user.name, ProtectedRoute checks if user exists, etc.

import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Try to load a previously logged-in user from localStorage on first load,
  // so refreshing the page doesn't log you out.
  const storedUser = localStorage.getItem('user');
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook so components can just write: const { user, login, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);