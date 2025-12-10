<<<<<<< Updated upstream
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{ padding: '20px', backgroundColor: '#f8f9fa', marginBottom: '20px' }}>
      <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
      {user ? (
        <>
          <span>Welcome, {user.username}!</span>
          <button
            onClick={logout}
            style={{ marginLeft: '20px', padding: '5px 10px' }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginRight: '20px' }}>Login</Link>
          <Link to="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
};

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to Lucia Auth Demo</h1>
      {user ? (
        <>
          <p>You are logged in as: <strong>{user.username}</strong></p>
          <Link to="/dashboard" style={{ fontSize: '18px' }}>
            Go to Dashboard
          </Link>
        </>
      ) : (
        <>
          <p>Please <Link to="/login">login</Link> or <Link to="/signup">sign up</Link> to continue.</p>
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
=======
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
>>>>>>> Stashed changes
  );
}

export default App;