import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatInterface from './components/Chat/ChatInterface';
import TeamSelection from './components/Teams/TeamSelection';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  return (
    <Router>
      <div className="app">
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