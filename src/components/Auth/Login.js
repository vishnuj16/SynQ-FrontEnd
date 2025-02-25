import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Fade,
  Alert,
  useTheme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd,
  Chat
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Animated background component with white dots
const AnimatedBackground = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      overflow: 'hidden',
      zIndex: 0,
    }}
  >
    {[...Array(100)].map((_, i) => (
      <Box
        key={i}
        component="div"
        sx={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '50%',
          top: `${Math.random() * 100}%`,
          left: `-20px`,
          animation: `floatRight ${15 + Math.random() * 10}s linear infinite`,
          animationDelay: `${Math.random() * -15}s`,
          '@keyframes floatRight': {
            '0%': {
              transform: 'translateX(0)',
              opacity: 0,
            },
            '10%': {
              opacity: 0.7,
            },
            '90%': {
              opacity: 0.7,
            },
            '100%': {
              transform: 'translateX(calc(100vw + 20px))',
              opacity: 0,
            }
          }
        }}
      />
    ))}
  </Box>
);

// Animated logo component
const AnimatedLogo = () => (
  <motion.div
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      mb: 3
    }}>
      <Chat sx={{ fontSize: 40, color: 'primary.main' }} />
      <Typography 
        variant="h4" 
        component="span" 
        fontWeight="bold"
        sx={{
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        SynQ
      </Typography>
    </Box>
  </motion.div>
);

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
    padding: 3
  },
  paper: {
    position: 'relative',
    overflow: 'hidden',
    padding: 4,
    width: '100%',
    maxWidth: 450,
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 2,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    mt: 2
  },
  submit: {
    mt: 3,
    height: 48,
    fontSize: '1.1rem',
    textTransform: 'none'
  },
  link: {
    mt: 2,
    textAlign: 'center',
    '& a': {
      color: 'primary.main',
      textDecoration: 'none',
      fontWeight: 500,
      '&:hover': {
        textDecoration: 'underline'
      }
    }
  }
};


function Login({ setIsAuthenticated }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access);
        localStorage.setItem('username', data.username);
        localStorage.setItem('user_id', data.user_id);
        setIsAuthenticated(true);
        navigate('/teams');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred during login');
      console.error('Login error:', error);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Container maxWidth={false} sx={styles.container}>
        <Fade in timeout={1000}>
          <Paper elevation={0} sx={styles.paper} component={motion.div}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}>
            <AnimatedLogo />
            
            <Typography variant="h5" textAlign="center" fontWeight="500" mb={1}>
              Welcome back
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonAdd color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={styles.submit}
                endIcon={<LoginIcon />}
              >
                Login
              </Button>
            </Box>

            <Typography sx={styles.link}>
              Don't have an account? <Link to="/register">Register</Link>
            </Typography>
          </Paper>
        </Fade>
      </Container>
    </>
  );
}


export default Login;