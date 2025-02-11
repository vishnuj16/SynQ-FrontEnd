import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatInterface from './components/Chat/ChatInterface';
import TeamSelection from './components/Teams/TeamSelection';
import GradientBackground from './GradientBackjround';
import './App.css';

function Header({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="app-header">
      <h1>Channels Chat</h1>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </header>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  return (
    <Router>
      <div className="app">
      <GradientBackground />
        {isAuthenticated && <Header setIsAuthenticated={setIsAuthenticated} />}
        <Routes>
          <Route path="/login" element={
            !isAuthenticated ? 
            <Login setIsAuthenticated={setIsAuthenticated} /> : 
            <Navigate to="/teams" />
          } />
          <Route path="/register" element={
            !isAuthenticated ? 
            <Register setIsAuthenticated={setIsAuthenticated} /> : 
            <Navigate to="/teams" />
          } />
          <Route path="/teams" element={
            isAuthenticated ? 
            <TeamSelection /> : 
            <Navigate to="/login" />
          } />
          <Route path="/chat/:teamId" element={
            isAuthenticated ? 
            <ChatInterface /> : 
            <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
