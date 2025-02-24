import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

function Header({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const username = localStorage.getItem('username');

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
    <AppBar 
      position="fixed" 
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
      }}
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          sx={{ mr: 2 }}
        >
          <ChatIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 500
          }}
        >
          Channels Chat
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="body1" 
            sx={{ 
              mr: 2,
              display: { xs: 'none', sm: 'block' } 
            }}
          >
            {username}
          </Typography>
          
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: theme.palette.secondary.main 
                }}
              >
                {username?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem 
              onClick={() => {
                handleClose();
                navigate('/profile');
              }}
            >
              <AccountCircleIcon sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleClose();
                handleLogout();
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;