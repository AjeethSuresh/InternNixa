import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import Session from './pages/Session';
import Navbar from './components/Navbar';
import ExploreCourses from './pages/ExploreCourses';
import MyLearning from './pages/MyLearning';
import Certificates from './pages/Certificates';
import Meet from './pages/Meet';
import MeetingRoom from './pages/MeetingRoom';
import Welcome from './pages/Welcome';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navbar toggleTheme={toggleTheme} theme={theme} />
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore-courses"
          element={
            <ProtectedRoute>
              <Navbar toggleTheme={toggleTheme} theme={theme} />
              <ExploreCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-learning"
          element={
            <ProtectedRoute>
              <Navbar toggleTheme={toggleTheme} theme={theme} />
              <MyLearning />
            </ProtectedRoute>
          }
        />

        <Route
          path="/certificates"
          element={
            <ProtectedRoute>
              <Navbar toggleTheme={toggleTheme} theme={theme} />
              <Certificates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/course/:courseId"
          element={
            <ProtectedRoute>
              <Navbar toggleTheme={toggleTheme} theme={theme} />
              <CourseDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/session"
          element={
            <ProtectedRoute>
              <Session />
            </ProtectedRoute>
          }
        />

        <Route
          path="/meet"
          element={
            <ProtectedRoute>
              <Navbar toggleTheme={toggleTheme} theme={theme} />
              <Meet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/meet/:meetingId"
          element={
            <ProtectedRoute>
              <MeetingRoom />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Navbar toggleTheme={toggleTheme} theme={theme} />
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Welcome />} />
      </Routes>
    </Router>
  );
}

export default App;
