import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatInterface from './components/Chat/ChatInterface';
import TeamSelection from './components/Teams/TeamSelection';
import theme from './theme';
import { isTokenValid } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenValid(token)) {
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>

      <Router>
        <div>
        {/* <GradientBackground /> */}
          {isAuthenticated}
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
              <TeamSelection setIsAuthenticated={setIsAuthenticated} /> : 
              <Navigate to="/login" />
            } />
            <Route path="/chat/:teamId" element={
              isAuthenticated ? 
              <ChatInterface setIsAuthenticated={setIsAuthenticated} /> : 
              <Navigate to="/login" />
            } />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>


    </ThemeProvider>
    
  );
}

export default App;
